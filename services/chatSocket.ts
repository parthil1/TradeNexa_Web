"use client";

import { io, type Socket } from "socket.io-client";
import axios from "axios";
import { API_BASE_URL, BACKEND_ORIGIN } from "@/config/api";
import { CHAT_SOCKET_LISTEN_EVENTS } from "@/config/chatSocketEvents";
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
/** App-level listeners that survive socket instance recreation. */
const eventHub = new Map<string, Set<ChatEventHandler>>();
let refreshInFlight: Promise<string> | null = null;
let authFailureHandled = false;

function setStatus(next: ChatSocketStatus) {
  if (status === next) return;
  status = next;
  statusListeners.forEach((listener) => listener(next));
}

export function getChatSocketStatus(): ChatSocketStatus {
  return status;
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
    } catch (err) {
      console.error(`[chat-socket] handler error for ${event}`, err);
    }
  });
}

/** Bridge every Postman Buyer + Seller listen event onto the live socket. */
function bindSocketEventBridges(s: Socket) {
  for (const event of CHAT_SOCKET_LISTEN_EVENTS) {
    s.on(event, (...args: unknown[]) => {
      if (process.env.NODE_ENV === "development") {
        console.info(`[chat-socket] recv ${event}`, ...args);
      }
      dispatchChatEvent(event, args);
    });
  }

  // Catch mistyped / alternate typing event names from the backend.
  s.onAny((event, ...args) => {
    const name = String(event);
    if (!name.toLowerCase().includes("typing")) return;
    if (name === "typing:indicator") return; // already bridged
    if (process.env.NODE_ENV === "development") {
      console.info("[chat-socket] onAny typing-related", name, args);
    }
    dispatchChatEvent("typing:indicator", args);
  });
}

function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

/**
 * Browser Socket.IO cannot set custom HTTP headers reliably.
 * Pass the token via handshake.auth (and query as a fallback).
 * Send both raw and Bearer forms — REST uses Bearer; Postman socket used raw.
 */
function buildAuthPayload(token: string) {
  const bearer = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  const raw = token.startsWith("Bearer ") ? token.slice(7).trim() : token;
  return {
    token: raw,
    access_token: raw,
    Authorization: raw,
    authorization: bearer,
  };
}

function applySocketAuth(s: Socket, token: string) {
  if (!token) return;
  const auth = buildAuthPayload(token);
  s.auth = auth;
  const raw = auth.token;
  s.io.opts.query = { ...(s.io.opts.query as object), token: raw, Authorization: raw };
  // Node/native clients only — harmless in browser.
  const opts = s.io.opts as { extraHeaders?: Record<string, string> };
  opts.extraHeaders = {
    Authorization: raw,
    authorization: auth.authorization,
  };
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

function rejoinRooms(s: Socket) {
  joinedConversationIds.forEach((conversationId) => {
    s.emit("conversation:join", { conversation_id: conversationId });
    s.emit("presence:subscribe", { conversation_id: conversationId });
  });
}

function emitWhenConnected(s: Socket, event: string, payload: unknown) {
  if (s.connected) {
    s.emit(event, payload);
    return;
  }
  s.once("connect", () => {
    s.emit(event, payload);
  });
}

/**
 * Socket.IO auth: handshake.auth carries the token (browser-safe).
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
    auth,
    query: { token: auth.token, Authorization: auth.token },
    extraHeaders: {
      Authorization: auth.token,
      authorization: auth.authorization,
    },
  });

  bindSocketEventBridges(socket);

  socket.on("connect", () => {
    authFailureHandled = false;
    setStatus("connected");
    rejoinRooms(socket!);
    if (process.env.NODE_ENV === "development") {
      console.info("[chat-socket] connected", socket!.id);
    }
  });

  socket.on("disconnect", (reason) => {
    setStatus("disconnected");
    if (process.env.NODE_ENV === "development") {
      console.warn("[chat-socket] disconnected:", reason);
    }
  });

  socket.io.on("reconnect_attempt", () => {
    setStatus("reconnecting");
    const latest = getStoredAccessToken() ?? "";
    if (socket && latest) applySocketAuth(socket, latest);
  });
  socket.io.on("reconnect", () => {
    setStatus("connected");
    if (socket) rejoinRooms(socket);
  });

  socket.on("connect_error", (err) => {
    const message = err?.message ?? "";
    if (process.env.NODE_ENV === "development") {
      console.warn("[chat-socket] connect_error:", message);
    }
    setStatus("reconnecting");

    if (!/invalid|expired|unauthorized|token|jwt|auth/i.test(message)) return;

    void refreshAccessToken()
      .then((newToken) => {
        if (!socket) return;
        applySocketAuth(socket, newToken);
        if (!socket.connected) socket.connect();
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
  joinedConversationIds.clear();
  if (!socket) {
    setStatus("disconnected");
    return;
  }
  // Drop the instance so the next connect rebuilds auth + lifecycle handlers cleanly.
  socket.disconnect();
  socket = null;
  setStatus("disconnected");
}

export function joinConversation(conversationId: number) {
  if (!Number.isFinite(conversationId) || conversationId <= 0) return;
  joinedConversationIds.add(conversationId);
  const s = connectChatSocket();
  emitWhenConnected(s, "conversation:join", { conversation_id: conversationId });
  emitWhenConnected(s, "presence:subscribe", { conversation_id: conversationId });
}

export function leaveConversation(conversationId: number) {
  joinedConversationIds.delete(conversationId);
  if (!socket?.connected) return;
  socket.emit("presence:unsubscribe", { conversation_id: conversationId });
  socket.emit("conversation:leave", { conversation_id: conversationId });
}

/** Emit `typing:indicator` — Buyer Chat + Seller Chat (Postman). */
export function emitTypingIndicator(
  conversationId: number,
  isTyping: boolean,
  extras?: { rfqId?: number | null }
) {
  if (!Number.isFinite(conversationId) || conversationId <= 0) return;
  const s = connectChatSocket();
  joinedConversationIds.add(conversationId);

  const payload: Record<string, unknown> = {
    conversation_id: conversationId,
    is_typing: Boolean(isTyping),
  };
  if (extras?.rfqId != null && Number.isFinite(extras.rfqId)) {
    payload.rfq_id = extras.rfqId;
  }

  const send = () => {
    // Do NOT re-join on every keystroke — that can drop in-flight typing events.
    if (!s.connected) return;
    s.emit("typing:indicator", payload);
    if (process.env.NODE_ENV === "development") {
      console.info("[chat-socket] emit typing:indicator", payload, { id: s.id });
    }
  };

  if (s.connected) {
    send();
    return;
  }
  // Ensure room membership, then send typing once connected.
  emitWhenConnected(s, "conversation:join", { conversation_id: conversationId });
  emitWhenConnected(s, "typing:indicator", payload);
}

/**
 * Emit `message:read` over the socket (in addition to REST mark-read).
 * Postman lists this on both Buyer and Seller Chat Events tabs.
 */
export function emitMessageRead(conversationId: number, lastReadMessageId: number) {
  if (!Number.isFinite(conversationId) || conversationId <= 0) return;
  if (!Number.isFinite(lastReadMessageId) || lastReadMessageId <= 0) return;
  const s = connectChatSocket();
  const payload = {
    conversation_id: conversationId,
    last_read_message_id: lastReadMessageId,
  };
  emitWhenConnected(s, "message:read", payload);
  if (process.env.NODE_ENV === "development") {
    console.info("[chat-socket] emit message:read", payload);
  }
}

function coerceBooleanFlag(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "typing", "start"].includes(normalized)) return true;
    if (["false", "0", "no", "stop", "idle"].includes(normalized)) return false;
  }
  return null;
}

function readTypingRecord(payload: unknown): Record<string, unknown> | null {
  if (payload == null) return null;
  if (typeof payload !== "object") return null;

  const root = payload as Record<string, unknown>;
  const nestedCandidates: Record<string, unknown>[] = [root];

  for (const key of ["data", "payload", "result", "body"] as const) {
    const nested = root[key];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      nestedCandidates.push(nested as Record<string, unknown>);
    }
  }

  for (let i = nestedCandidates.length - 1; i >= 0; i -= 1) {
    const record = nestedCandidates[i];
    if (
      "conversation_id" in record ||
      "conversationId" in record ||
      "is_typing" in record ||
      "typing" in record ||
      "isTyping" in record
    ) {
      return { ...root, ...record };
    }
  }

  return root;
}

/** Parse inbound `typing:indicator` payloads. */
export function parseTypingPayload(
  payload: unknown,
  fallbackConversationId?: number | null
): {
  conversationId: number;
  userId: number | null;
  isTyping: boolean;
  rfqId: number | null;
} | null {
  const record = readTypingRecord(payload);
  if (!record) {
    if (fallbackConversationId && Number.isFinite(fallbackConversationId)) {
      return {
        conversationId: fallbackConversationId,
        userId: null,
        isTyping: true,
        rfqId: null,
      };
    }
    return null;
  }

  const conversationRaw =
    record.conversation_id ??
    record.conversationId ??
    record.room_id ??
    (record.conversation && typeof record.conversation === "object"
      ? (record.conversation as Record<string, unknown>).id
      : null) ??
    fallbackConversationId;

  const conversationId = Number(conversationRaw);
  if (!Number.isFinite(conversationId) || conversationId <= 0) return null;

  const rawUser =
    record.user_id ??
    record.sender_id ??
    record.typer_id ??
    record.participant_id ??
    (record.user && typeof record.user === "object"
      ? (record.user as Record<string, unknown>).id
      : null);
  const userIdNum = Number(rawUser);
  const userId = Number.isFinite(userIdNum) && userIdNum > 0 ? userIdNum : null;

  const rfqRaw = record.rfq_id ?? record.rfqId;
  const rfqNum = Number(rfqRaw);
  const rfqId = Number.isFinite(rfqNum) && rfqNum > 0 ? rfqNum : null;

  const flagged =
    coerceBooleanFlag(record.is_typing) ??
    coerceBooleanFlag(record.typing) ??
    coerceBooleanFlag(record.isTyping);

  let isTyping: boolean;
  if (flagged != null) {
    isTyping = flagged;
  } else if (typeof record.status === "string") {
    const value = record.status.toLowerCase();
    if (value === "typing" || value === "start") isTyping = true;
    else if (value === "stop" || value === "idle") isTyping = false;
    else return null;
  } else {
    isTyping = true;
  }

  return { conversationId, userId, isTyping, rfqId };
}

/** Best-effort unwrap of common socket event envelopes. */
export function unwrapSocketPayload(payload: unknown): unknown {
  if (payload == null) return payload;
  if (typeof payload !== "object") return payload;
  const record = payload as Record<string, unknown>;
  if (record.message && typeof record.message === "object") {
    const msg = record.message as Record<string, unknown>;
    if ("id" in msg || "conversation_id" in msg || "content" in msg) return record.message;
  }
  if (record.data && typeof record.data === "object") {
    const data = record.data as Record<string, unknown>;
    if (
      "id" in data ||
      "conversation_id" in data ||
      "message" in data ||
      "user_id" in data ||
      "is_online" in data
    ) {
      return unwrapSocketPayload(record.data);
    }
  }
  if (record.payload && typeof record.payload === "object") {
    return unwrapSocketPayload(record.payload);
  }
  return payload;
}

/** Parse presence from socket realtime events (`presence:update`, `user:online`, etc.). */
export function parsePresencePayload(
  payload: unknown,
  forcedOnline?: boolean
): { userId: number; online: boolean } | null {
  const data = unwrapSocketPayload(payload);
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  const userId = Number(
    record.user_id ?? record.id ?? record.other_user_id ?? record.participant_id ?? record.sender_id
  );
  if (!Number.isFinite(userId) || userId <= 0) return null;

  if (typeof forcedOnline === "boolean") {
    return { userId, online: forcedOnline };
  }

  let online: boolean | null = null;
  if (typeof record.is_online === "boolean") online = record.is_online;
  else if (typeof record.online === "boolean") online = record.online;
  else if (typeof record.presence === "string") {
    const value = record.presence.toLowerCase();
    if (value === "online" || value === "active") online = true;
    if (value === "offline" || value === "away" || value === "inactive") online = false;
  } else if (typeof record.status === "string") {
    const value = record.status.toLowerCase();
    if (value === "online" || value === "active") online = true;
    if (value === "offline" || value === "away" || value === "inactive") online = false;
  }

  if (online == null) return null;
  return { userId, online };
}
