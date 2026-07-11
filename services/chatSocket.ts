"use client";

import { io, type Socket } from "socket.io-client";
import axios from "axios";
import { API_BASE_URL, BACKEND_ORIGIN } from "@/config/api";
import { API_ENDPOINTS } from "@/config/endpoints";
import { getAccessToken, getRefreshToken, unwrapApiPayload } from "@/utils/authHelpers";

export type ChatSocketStatus = "disconnected" | "connecting" | "connected" | "reconnecting";

type StatusListener = (status: ChatSocketStatus) => void;

let socket: Socket | null = null;
let status: ChatSocketStatus = "disconnected";
const statusListeners = new Set<StatusListener>();
/** Conversation rooms this client should stay in across reconnects. */
const joinedConversationIds = new Set<number>();
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

  socket.on("connect", () => {
    authFailureHandled = false;
    setStatus("connected");
    rejoinRooms(socket!);
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
}

export function leaveConversation(conversationId: number) {
  joinedConversationIds.delete(conversationId);
  if (!socket?.connected) return;
  socket.emit("conversation:leave", { conversation_id: conversationId });
}

export function emitTypingIndicator(conversationId: number, isTyping: boolean) {
  if (!Number.isFinite(conversationId) || conversationId <= 0) return;
  const s = getChatSocket();
  if (!s.connected) return;
  s.emit("typing:indicator", { conversation_id: conversationId, is_typing: isTyping });
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
    if ("id" in data || "conversation_id" in data || "message" in data) {
      return unwrapSocketPayload(record.data);
    }
  }
  if (record.payload && typeof record.payload === "object") {
    return unwrapSocketPayload(record.payload);
  }
  return payload;
}
