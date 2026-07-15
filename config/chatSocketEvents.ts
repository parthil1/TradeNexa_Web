/**
 * Socket.IO events from Chat Module Frontend Guide.
 *
 * Rooms: user:{id} (auto on connect), conversation:{id} (after conversation:join)
 * Auth: handshake.auth.token = raw JWT
 *
 * Send chat text via REST only — Socket delivers receive_message / message:new after DB write.
 * Nav unread badge is driven by these live events (seeded once via REST on connect).
 */

/** Server → client (canonical) */
export const CHAT_SOCKET_LISTEN_EVENTS = [
  "message:new",
  "conversation:updated",
  "message:read",
  /** Live Unread Inbox guide — full badge + per-conversation snapshot */
  "unread_summary",
  "chat:error",
] as const;

/**
 * Guide aliases — bind these on the socket and fan-in to the canonical handlers
 * so nav unread stays live regardless of which event name the backend emits.
 */
export const CHAT_SOCKET_ALIAS_EVENTS = {
  receive_message: "message:new",
  messages_read: "message:read",
} as const;

/** Client → server */
export const CHAT_SOCKET_EMIT_EVENTS = [
  "conversation:join",
  "conversation:leave",
  "message:read",
  /** Request a fresh unread_summary snapshot */
  "get_unread_summary",
] as const;

export type ChatSocketListenEvent = (typeof CHAT_SOCKET_LISTEN_EVENTS)[number];
export type ChatSocketEmitEvent = (typeof CHAT_SOCKET_EMIT_EVENTS)[number];
