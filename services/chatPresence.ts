/**
 * Chat presence lifecycle (buyer + seller).
 *
 * Online only while a chat conversation is actively open in a visible tab.
 * Offline is forced on: sidebar close, unmount, navigation, refresh, tab/window
 * close, tab hidden, and logout.
 *
 * Guide flow:
 * - conversation:join / conversation:leave for room membership
 * - presence:ping for heartbeats (server emits presence:update)
 * - Local presence relay as a same-origin fallback when socket presence is delayed
 */

import {
  joinConversation,
  leaveConversation,
  getExistingChatSocket,
  connectChatSocket,
  emitPresencePing,
} from "@/services/chatSocket";
import { publishPresenceRelay } from "@/services/presenceRelay";

const TAB_ID =
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `tab-${Math.random().toString(36).slice(2)}`;

const TAB_REGISTRY_KEY = "tradenexa_chat_presence_tabs";
/** Drop stale tab registrations (crash / killed tab). */
const TAB_STALE_MS = 60_000;

type PresenceSession = {
  conversationId: number;
  userId: number;
};

let session: PresenceSession | null = null;
/** Soft session kept across visibility:hidden so we can resume Online. */
let softSession: PresenceSession | null = null;
let online = false;
let lifecycleBound = false;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
/** Cancels Strict Mode false-offline when chat remounts immediately. */
let pendingOfflineTimer: ReturnType<typeof setTimeout> | null = null;

function cancelPendingOffline() {
  if (pendingOfflineTimer) {
    clearTimeout(pendingOfflineTimer);
    pendingOfflineTimer = null;
  }
}

type TabRegistry = Record<string, number>;

function readTabRegistry(): TabRegistry {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(TAB_REGISTRY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as TabRegistry;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeTabRegistry(registry: TabRegistry) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TAB_REGISTRY_KEY, JSON.stringify(registry));
  } catch {
    /* ignore quota / private mode */
  }
}

function tabKey(conversationId: number) {
  return `${conversationId}:${TAB_ID}`;
}

function pruneRegistry(registry: TabRegistry): TabRegistry {
  const now = Date.now();
  const next: TabRegistry = {};
  for (const [key, at] of Object.entries(registry)) {
    if (now - at <= TAB_STALE_MS) next[key] = at;
  }
  return next;
}

function registerLocalTab(conversationId: number) {
  const registry = pruneRegistry(readTabRegistry());
  registry[tabKey(conversationId)] = Date.now();
  writeTabRegistry(registry);
}

function unregisterLocalTab(conversationId: number): boolean {
  const registry = pruneRegistry(readTabRegistry());
  delete registry[tabKey(conversationId)];
  writeTabRegistry(registry);
  return !Object.keys(registry).some((key) => key.startsWith(`${conversationId}:`));
}

function touchLocalTab(conversationId: number) {
  const registry = pruneRegistry(readTabRegistry());
  if (registry[tabKey(conversationId)]) {
    registry[tabKey(conversationId)] = Date.now();
    writeTabRegistry(registry);
  }
}

function emitSocketOnline(conversationId: number, userId?: number) {
  joinConversation(conversationId, userId);
  emitPresencePing();
}

/** Lightweight heartbeat — refresh relay + presence:ping without re-join spam. */
function emitSocketPresenceHeartbeat(conversationId: number, userId?: number) {
  const s = getExistingChatSocket();
  if (!s?.connected) {
    // Socket dropped — one re-join is appropriate.
    joinConversation(conversationId, userId);
    return;
  }
  emitPresencePing();
}

function emitSocketOffline(conversationId: number, userId?: number) {
  leaveConversation(conversationId, userId);
}

/** Prefer sendBeacon on unload so offline still reaches the relay. */
function publishOfflineReliable(conversationId: number, userId: number) {
  const body = JSON.stringify({
    conversation_id: conversationId,
    user_id: userId,
    is_online: false,
  });

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    try {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon("/api/chat/presence", blob)) return;
    } catch {
      /* fall through */
    }
  }

  void publishPresenceRelay({ conversationId, userId, online: false });
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

function startHeartbeat() {
  stopHeartbeat();
  heartbeatTimer = setInterval(() => {
    if (!session || !online) return;
    if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
    touchLocalTab(session.conversationId);
    // Do not re-emit conversation:join every 15s — that re-triggers peer
    // join-ack handlers and falsely marks peers online.
    emitSocketPresenceHeartbeat(session.conversationId, session.userId);
    void publishPresenceRelay({
      conversationId: session.conversationId,
      userId: session.userId,
      online: true,
    });
  }, 15_000);
}

/**
 * Mark the current user Online for a conversation (chat sidebar / panel open).
 * Dedupes repeated calls for the same session.
 */
export function goChatOnline(conversationId: number, userId: number) {
  if (!Number.isFinite(conversationId) || conversationId <= 0) return;
  if (!Number.isFinite(userId) || userId <= 0) return;

  cancelPendingOffline();
  softSession = null;

  if (session && session.conversationId !== conversationId) {
    goChatOffline({ reason: "switch" });
  }

  session = { conversationId, userId };
  registerLocalTab(conversationId);
  bindPresenceLifecycle();

  // Hidden tab should not appear Online.
  if (typeof document !== "undefined" && document.visibilityState === "hidden") {
    online = false;
    softSession = session;
    return;
  }

  if (online && session.conversationId === conversationId) {
    touchLocalTab(conversationId);
    return;
  }

  online = true;
  connectChatSocket();
  emitSocketOnline(conversationId, userId);
  void publishPresenceRelay({ conversationId, userId, online: true });
  startHeartbeat();
}

/**
 * Mark Offline. Always safe to call.
 * Multi-tab: only broadcasts offline when this was the last tab for the conversation
 * (unless `force` — used for unload).
 */
export function goChatOffline(options?: {
  reason?: "close" | "unload" | "hidden" | "logout" | "switch" | "unmount";
  force?: boolean;
}) {
  const reason = options?.reason;
  const force = Boolean(options?.force);

  // Unmount/close: brief delay so React Strict Mode remount does not flash Offline.
  if ((reason === "unmount" || reason === "close") && !force) {
    cancelPendingOffline();
    pendingOfflineTimer = setTimeout(() => {
      pendingOfflineTimer = null;
      goChatOffline({ reason, force: true });
    }, 120);
    return;
  }

  cancelPendingOffline();

  const active = session;
  if (!active) {
    stopHeartbeat();
    online = false;
    if (reason !== "hidden") softSession = null;
    return;
  }

  const { conversationId, userId } = active;
  const lastTab = unregisterLocalTab(conversationId);
  const shouldBroadcast = force || lastTab;

  stopHeartbeat();
  online = false;

  if (reason === "hidden") {
    softSession = active;
    session = null;
  } else {
    softSession = null;
    session = null;
  }

  if (!shouldBroadcast) return;

  if (reason === "unload") {
    publishOfflineReliable(conversationId, userId);
    try {
      leaveConversation(conversationId);
    } catch {
      /* ignore */
    }
    return;
  }

  emitSocketOffline(conversationId, userId);
  void publishPresenceRelay({ conversationId, userId, online: false });
}

export function getActivePresenceSession(): PresenceSession | null {
  return session ?? softSession;
}

export function isChatPresenceOnline(): boolean {
  return online;
}

function onPageHide() {
  goChatOffline({ reason: "unload", force: true });
}

function onBeforeUnload() {
  goChatOffline({ reason: "unload", force: true });
}

function onVisibilityChange() {
  if (typeof document === "undefined") return;

  if (document.visibilityState === "hidden") {
    if (session) {
      goChatOffline({ reason: "hidden" });
    }
    return;
  }

  if (document.visibilityState === "visible" && softSession) {
    const resume = softSession;
    softSession = null;
    goChatOnline(resume.conversationId, resume.userId);
  }
}

function onStorage(event: StorageEvent) {
  if (event.key !== TAB_REGISTRY_KEY) return;
}

function bindPresenceLifecycle() {
  if (lifecycleBound || typeof window === "undefined") return;
  lifecycleBound = true;

  // Desktop refresh / close — pairs with sendBeacon offline.
  window.addEventListener("beforeunload", onBeforeUnload);
  // Mobile + bfcache-friendly unload.
  window.addEventListener("pagehide", onPageHide);
  // Tab blur / restore.
  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("storage", onStorage);
}

export function unbindPresenceLifecycle() {
  if (!lifecycleBound || typeof window === "undefined") return;
  lifecycleBound = false;
  window.removeEventListener("beforeunload", onBeforeUnload);
  window.removeEventListener("pagehide", onPageHide);
  document.removeEventListener("visibilitychange", onVisibilityChange);
  window.removeEventListener("storage", onStorage);
}

/** Logout / auth loss: force offline and tear down listeners. */
export function resetChatPresence() {
  cancelPendingOffline();
  goChatOffline({ reason: "logout", force: true });
  softSession = null;
  unbindPresenceLifecycle();
}
