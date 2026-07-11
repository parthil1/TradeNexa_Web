/**
 * Socket.IO events from Postman:
 * - Buyer Chat (Events 7)
 * - Seller Chat (Events 6)
 *
 * Shared client uses the union so both roles work on one connection
 * (role is determined by the auth token, not a separate namespace).
 */

/** Server → client (Postman Events tab, Listen ON). */
export const CHAT_SOCKET_LISTEN_EVENTS = [
  "conversation:join",
  "message:new",
  "conversation:updated", // Buyer Chat only in Postman; safe for seller too
  "typing:indicator",
  "message:read",
  "chat:error",
  "presence:update",
] as const;

/** Client → server (Postman Message tab + chat flow). */
export const CHAT_SOCKET_EMIT_EVENTS = [
  "conversation:join",
  "conversation:leave",
  "typing:indicator",
  "message:read",
  "presence:subscribe",
  "presence:unsubscribe",
] as const;

export type ChatSocketListenEvent = (typeof CHAT_SOCKET_LISTEN_EVENTS)[number];
export type ChatSocketEmitEvent = (typeof CHAT_SOCKET_EMIT_EVENTS)[number];
