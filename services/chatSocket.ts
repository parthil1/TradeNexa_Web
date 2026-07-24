"use client";

import { io, type Socket } from "socket.io-client";
import axios from "axios";
import { API_BASE_URL, BACKEND_ORIGIN } from "@/config/api";
import { CHAT_SOCKET_ALIAS_EVENTS, CHAT_SOCKET_LISTEN_EVENTS } from "@/config/chatSocketEvents";
import { API_ENDPOINTS } from "@/config/endpoints";
import { getAccessToken, getRefreshToken, unwrapApiPayload } from "@/utils/authHelpers";

export type ChatSocketStatus = "disconnected" | "connecting" | "connected" | "reconnecting";

type StatusListener = (status: ChatSocketStatus) => void;
type ChatEventHandler = (...args: unknown[]) => void;

let socket: Socket | null = null;
let status: ChatSocketStatus = "disconnected";
const statusListeners = new Set<StatusListener>();
/** Conversation rooms this client should stay in across reconnects. */
const joinedConversationIds = new Set<number>();
/**
 * Leaves that could not be emitted because the socket was down.
 * Flushed on the next connect.
 */
const pendingLeaveByConversation = new Map<number, Record<string, unknown>>();
/** Deduped pending emits while disconnected (avoids stacking `once("connect")` listeners). */
const pendingConnectEmits = new Map<string, unknown>();
let pendingConnectFlushBound = false;
/** App-level listeners that survive socket instance recreation. */
const eventHub = new Map<string, Set<ChatEventHandler>>();
let refreshInFlight: Promise<string> | null = null;
let authFailureHandled = false;
/** Prevent auth refresh → connect storms on repeated connect_error. */
let lastAuthRefreshAt = 0;
const AUTH_REFRESH_COOLDOWN_MS = 5_000;

function setStatus(next: ChatSocketStatus) {
  if (status === next) return;
  status = next;
  statusListeners.forEach((listener) => listener(next));
}

export function getChatSocketStatus(): ChatSocketStatus {
  return status;
}

/** Existing instance only — never creates a new connection (safe for unload/logout). */
export function getExistingChatSocket(): Socket | null {
  return socket;
}

export function subscribeChatSocketStatus(listener: StatusListener): () => void {
  statusListeners.add(listener);
  listener(status);
  return () => statusListeners.delete(listener);
}

/**
 * Subscribe to a Socket.IO event via a hub that stays attached across reconnects
 * and React effect remounts.
 */
export function subscribeChatEvent(event: string, handler: ChatEventHandler): () => void {
  let handlers = eventHub.get(event);
  if (!handlers) {
    handlers = new Set();
    eventHub.set(event, handlers);
  }
  handlers.add(handler);
  return () => {
    handlers?.delete(handler);
  };
}

function dispatchChatEvent(event: string, args: unknown[]) {
  const handlers = eventHub.get(event);
  if (!handlers || handlers.size === 0) return;
  handlers.forEach((handler) => {
    try {
      handler(...args);
    } catch {
      // Ignore handler errors so one subscriber cannot break others.
    }
  });
}

/** Bridge guide listen events onto the live socket. */
function bindSocketEventBridges(s: Socket) {
  for (const event of CHAT_SOCKET_LISTEN_EVENTS) {
    s.on(event, (...args: unknown[]) => {
      dispatchChatEvent(event, args);
    });
  }

  // Guide aliases → fan-in to the canonical event only (avoid double-dispatch
  // if the backend ever emits both receive_message and message:new).
  for (const [alias, canonical] of Object.entries(CHAT_SOCKET_ALIAS_EVENTS)) {
    s.on(alias, (...args: unknown[]) => {
      dispatchChatEvent(canonical, args);
    });
  }
}

function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

/**
 * Browser Socket.IO cannot set custom HTTP headers reliably.
 * Guide: auth: { token: accessToken } — raw JWT (no Bearer prefix).
 */
function buildAuthPayload(token: string) {
  const raw = token.startsWith("Bearer ") ? token.slice(7).trim() : token;
  return {
    token: raw,
  };
}

function applySocketAuth(s: Socket, token: string) {
  if (!token) return;
  const auth = buildAuthPayload(token);
  s.auth = auth;
  // Query fallback for backends that read handshake.query.token
  s.io.opts.query = { ...(s.io.opts.query as object), token: auth.token };
}

async function refreshAccessToken(): Promise<string> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) throw new Error("No refresh token available");

    const refreshRes = await axios.post(
      `${API_BASE_URL}${API_ENDPOINTS.REFRESH_TOKEN}`,
      { refresh_token: refreshToken },
      { headers: { "Content-Type": "application/json" } }
    );

    const data = unwrapApiPayload<Record<string, unknown>>(refreshRes.data);
    const newAccessToken = getAccessToken(data);
    const newRefreshToken = getRefreshToken(data);
    if (!newAccessToken) throw new Error("Refresh response did not include an access token");

    localStorage.setItem("token", newAccessToken);
    if (newRefreshToken) localStorage.setItem("refresh_token", newRefreshToken);
    return newAccessToken;
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

function handleAuthFailure() {
  if (authFailureHandled || typeof window === "undefined") return;
  authFailureHandled = true;
  localStorage.removeItem("token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  window.dispatchEvent(new Event("auth_unauthorized"));
  window.location.replace("/");
}

function flushPendingLeaves(s: Socket) {
  if (pendingLeaveByConversation.size === 0) return;
  for (const [conversationId, payload] of pendingLeaveByConversation) {
    // Skip if we rejoined this room before the leave could flush.
    if (joinedConversationIds.has(conversationId)) continue;
    s.emit("conversation:leave", payload);
  }
  pendingLeaveByConversation.clear();
}

function rejoinRooms(s: Socket) {
  // Leave queued rooms first, then re-join active conversation rooms.
  flushPendingLeaves(s);
  joinedConversationIds.forEach((conversationId) => {
    // Guide: conversation:join { conversation_id }
    s.emit("conversation:join", { conversation_id: conversationId });
  });
}

function pendingEmitKey(event: string, payload: unknown): string {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const conversationId = record.conversation_id ?? record.conversationId ?? "";
    return `${event}::${String(conversationId)}`;
  }
  return `${event}::`;
}

function flushPendingConnectEmits(s: Socket) {
  if (pendingConnectEmits.size === 0) return;
  const entries = Array.from(pendingConnectEmits.entries());
  pendingConnectEmits.clear();
  for (const [key, payload] of entries) {
    const event = key.split("::")[0];
    if (!event) continue;
    if (payload == null) s.emit(event);
    else s.emit(event, payload);
  }
}

function emitWhenConnected(s: Socket, event: string, payload: unknown) {
  if (s.connected) {
    if (payload === undefined) s.emit(event);
    else s.emit(event, payload);
    return;
  }
  // Dedup by event+conversation so reconnect storms don't stack once() listeners.
  pendingConnectEmits.set(pendingEmitKey(event, payload), payload === undefined ? null : payload);
  if (pendingConnectFlushBound) return;
  pendingConnectFlushBound = true;
  s.once("connect", () => {
    pendingConnectFlushBound = false;
    flushPendingConnectEmits(s);
  });
}

/**
 * Socket.IO auth: handshake.auth.token = raw JWT (guide).
 * Also mirrors token on query for backends that read handshake.query.
 */
export function getChatSocket(): Socket {
  if (socket) return socket;

  const token = getStoredAccessToken() ?? "";
  const auth = buildAuthPayload(token);

  socket = io(BACKEND_ORIGIN, {
    path: "/socket.io",
    // Prefer websocket; allow polling fallback (proxies / Railway quirks).
    transports: ["websocket", "polling"],
    upgrade: true,
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
    timeout: 20000,
    // Guide: auth: { token: accessToken }, path: '/socket.io'
    auth,
    query: { token: auth.token },
  });

  bindSocketEventBridges(socket);

  socket.on("connect", () => {
    authFailureHandled = false;
    setStatus("connected");
    // `connect` also fires after Manager `reconnect` — rejoin once here only.
    rejoinRooms(socket!);
  });

  socket.on("disconnect", () => {
    setStatus("disconnected");
    // Drop queued connect emits — rejoinRooms + callers will re-issue after reconnect.
    pendingConnectEmits.clear();
    pendingConnectFlushBound = false;
  });

  socket.io.on("reconnect_attempt", () => {
    setStatus("reconnecting");
    const latest = getStoredAccessToken() ?? "";
    if (socket && latest) applySocketAuth(socket, latest);
  });
  // Do not rejoin here — socket `connect` already runs after a successful reconnect.

  socket.on("connect_error", (err) => {
    const message = err?.message ?? "";
    setStatus("reconnecting");

    if (!/invalid|expired|unauthorized|token|jwt|auth/i.test(message)) return;
    if (Date.now() - lastAuthRefreshAt < AUTH_REFRESH_COOLDOWN_MS) return;
    lastAuthRefreshAt = Date.now();

    void refreshAccessToken()
      .then((newToken) => {
        if (!socket) return;
        // Update handshake auth only — Manager already owns reconnection.
        // Calling socket.connect() here races auto-reconnect and causes churn.
        applySocketAuth(socket, newToken);
      })
      .catch(() => {
        handleAuthFailure();
      });
  });

  return socket;
}

export function connectChatSocket(): Socket {
  const s = getChatSocket();
  const token = getStoredAccessToken() ?? "";
  applySocketAuth(s, token);
  authFailureHandled = false;

  if (!s.connected) {
    setStatus(status === "connected" ? "reconnecting" : "connecting");
    s.connect();
  }
  return s;
}

export function disconnectChatSocket() {
  // Announce offline for every joined room before dropping the socket.
  leaveAllConversations();
  pendingLeaveByConversation.clear();
  pendingConnectEmits.clear();
  pendingConnectFlushBound = false;
  if (!socket) {
    setStatus("disconnected");
    return;
  }
  // Drop the instance so the next connect rebuilds auth + lifecycle handlers cleanly.
  socket.disconnect();
  socket = null;
  setStatus("disconnected");
}

export function joinConversation(conversationId: number, _userId?: number | null) {
  if (!Number.isFinite(conversationId) || conversationId <= 0) return;
  joinedConversationIds.add(conversationId);
  pendingLeaveByConversation.delete(conversationId);
  const s = connectChatSocket();
  // Guide: emit conversation:join before expecting live messages.
  emitWhenConnected(s, "conversation:join", { conversation_id: conversationId });
}

export function leaveConversation(conversationId: number, _userId?: number | null) {
  joinedConversationIds.delete(conversationId);
  const payload = { conversation_id: conversationId };
  if (!socket?.connected) {
    // Queue leave so reconnect flush can still notify peers.
    pendingLeaveByConversation.set(conversationId, payload);
    return;
  }
  pendingLeaveByConversation.delete(conversationId);
  // Guide: emit conversation:leave on unmount / leave screen.
  socket.emit("conversation:leave", payload);
}

/** Leave every joined room (logout / hard disconnect). */
export function leaveAllConversations() {
  const ids = Array.from(joinedConversationIds);
  for (const conversationId of ids) {
    leaveConversation(conversationId);
  }
  joinedConversationIds.clear();
}

/**
 * Guide client → server: message:read { conversation_id, last_read_message_id? }
 * Server persists + notifies peer with message:read (S→C).
 */
const lastEmittedReadByConversation = new Map<number, number>();

export function emitMessageRead(conversationId: number, lastReadMessageId?: number) {
  if (!Number.isFinite(conversationId) || conversationId <= 0) return;

  if (
    lastReadMessageId != null &&
    Number.isFinite(lastReadMessageId) &&
    lastReadMessageId > 0
  ) {
    const prev = lastEmittedReadByConversation.get(conversationId) ?? 0;
    // Monotonic — skip duplicate / older cursor for the same room.
    if (lastReadMessageId <= prev) return;
    lastEmittedReadByConversation.set(conversationId, lastReadMessageId);
  }

  const s = connectChatSocket();
  const payload: Record<string, unknown> = {
    conversation_id: conversationId,
  };
  if (
    lastReadMessageId != null &&
    Number.isFinite(lastReadMessageId) &&
    lastReadMessageId > 0
  ) {
    payload.last_read_message_id = lastReadMessageId;
  }
  emitWhenConnected(s, "message:read", payload);
}

/**
 * Guide: Live Unread Inbox — request a fresh `unread_summary` snapshot.
 * Server replies on this socket only (user room).
 */
export function emitGetUnreadSummary() {
  const s = connectChatSocket();
  emitWhenConnected(s, "get_unread_summary", undefined);
}

/** Guide §7.2 — request `notification:unread_count` for RFQ/inquiry inbox badge. */
export function emitNotificationGetUnreadCount() {
  const s = connectChatSocket();
  emitWhenConnected(s, "notification:get_unread_count", undefined);
}

/** Guide §7.2 — mark one inbox notification read via socket. */
export function emitNotificationMarkRead(notificationId: number) {
  if (!Number.isFinite(notificationId) || notificationId <= 0) return;
  const s = connectChatSocket();
  emitWhenConnected(s, "notification:mark_read", {
    notification_id: notificationId,
    id: notificationId,
  });
}

/** Guide §7.2 — mark all inbox notifications read via socket (role-scoped). */
export function emitNotificationMarkAllRead(role?: "buyer" | "seller") {
  const s = connectChatSocket();
  emitWhenConnected(
    s,
    "notification:mark_all_read",
    role === "buyer" || role === "seller" ? { role } : undefined
  );
}

/**
 * Socket.IO may emit a single object, or split args like
 * `(conversation_id, message)` / `(message, ackFn)`. Normalize to one payload.
 */
export function coalesceIncomingSocketPayload(args: unknown[]): unknown {
  if (args.length === 0) return null;
  const first = args[0];
  const second = args[1];

  // Ignore Socket.IO ack callbacks in the arg list.
  const meaningful = args.filter((arg) => typeof arg !== "function");
  if (meaningful.length === 0) return null;
  if (meaningful.length === 1) return meaningful[0];

  const a = meaningful[0];
  const b = meaningful[1];

  if (
    (typeof a === "number" || (typeof a === "string" && /^\d+$/.test(a))) &&
    b &&
    typeof b === "object"
  ) {
    return { conversation_id: Number(a), message: b };
  }

  if (a && typeof a === "object" && b && typeof b === "object") {
    const aRec = a as Record<string, unknown>;
    const bRec = b as Record<string, unknown>;
    if (
      ("conversation_id" in aRec || "conversationId" in aRec) &&
      ("id" in bRec || "content" in bRec || "message_type" in bRec)
    ) {
      return {
        ...aRec,
        message: b,
        conversation_id: aRec.conversation_id ?? aRec.conversationId,
      };
    }
  }

  void first;
  void second;
  return a;
}

/** Best-effort unwrap of common socket event envelopes. */
export function unwrapSocketPayload(payload: unknown): unknown {
  if (payload == null) return payload;
  if (typeof payload !== "object") return payload;
  const record = payload as Record<string, unknown>;

  const parentConversationId =
    record.conversation_id ?? record.conversationId ?? null;

  if (record.message && typeof record.message === "object") {
    const msg = record.message as Record<string, unknown>;
    if ("id" in msg || "conversation_id" in msg || "content" in msg || "message_type" in msg) {
      // Guide: { conversation_id, message } — message may omit conversation_id
      if (
        parentConversationId != null &&
        msg.conversation_id == null &&
        msg.conversationId == null
      ) {
        return { ...msg, conversation_id: parentConversationId };
      }
      return record.message;
    }
  }
  if (record.data && typeof record.data === "object") {
    const data = record.data as Record<string, unknown>;
    if (
      "id" in data ||
      "conversation_id" in data ||
      "message" in data ||
      "user_id" in data ||
      "unread_count" in data ||
      "total" in data ||
      "as_buyer" in data ||
      "conversations" in data
    ) {
      return unwrapSocketPayload(record.data);
    }
  }
  if (record.payload && typeof record.payload === "object") {
    return unwrapSocketPayload(record.payload);
  }
  return payload;
}
