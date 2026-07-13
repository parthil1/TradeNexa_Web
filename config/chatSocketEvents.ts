/**
 * Socket.IO events from Chat Module Frontend Guide.
 *
 * Rooms: user:{id} (auto on connect), conversation:{id} (after conversation:join)
 * Auth: handshake.auth.token = raw JWT
 *
 * Critical: send chat text via REST only — Socket never accepts message content.
 */

/** Server → client */
export const CHAT_SOCKET_LISTEN_EVENTS = [
  "message:new",
  "conversation:updated",
  "typing:indicator",
  "message:read",
  "presence:update",
  "chat:error",
] as const;

/** Client → server */
export const CHAT_SOCKET_EMIT_EVENTS = [
  "conversation:join",
  "conversation:leave",
  "typing:start",
  "typing:stop",
  "message:read",
  "presence:ping",
] as const;

/**
 * Optional echoes some backends still send when a peer joins/leaves a room.
 * Not in the guide listen list, but useful for Online/Offline UI.
 */
export const CHAT_SOCKET_EXTRA_LISTEN_EVENTS = [
  "conversation:join",
  "conversation:leave",
] as const;

export type ChatSocketListenEvent = (typeof CHAT_SOCKET_LISTEN_EVENTS)[number];
export type ChatSocketEmitEvent = (typeof CHAT_SOCKET_EMIT_EVENTS)[number];
