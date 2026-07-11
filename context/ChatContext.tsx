"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/hooks/useAuth";
import { useActiveRole } from "@/context/ActiveRoleContext";
import {
  connectChatSocket,
  disconnectChatSocket,
  emitMessageRead,
  emitTypingIndicator,
  joinConversation,
  leaveConversation,
  parseConversationPresencePayload,
  parsePresencePayload,
  parseTypingPayload,
  subscribeChatEvent,
  subscribeChatSocketStatus,
  unwrapSocketPayload,
  type ChatSocketStatus,
} from "@/services/chatSocket";
import { CHAT_SOCKET_LISTEN_EVENTS } from "@/config/chatSocketEvents";
import { fetchTypingRelay, publishTypingRelay } from "@/services/typingRelay";
import { fetchPresenceRelay, publishPresenceRelay } from "@/services/presenceRelay";
import {
  fetchConversation,
  fetchConversations,
  fetchMessages,
  fetchRfqConversations,
  fetchUnreadSummary,
  markConversationRead,
  sendMediaMessage,
  sendMessage,
} from "@/services/chatService";
import {
  normalizeChatConversation,
  normalizeChatMessage,
  resolveAuthNumericUserId,
  applyMessageOwnership,
  countsAsUnreadChatMessage,
  effectiveConversationUnread,
} from "@/utils/chatHelpers";
import { showErrorToast } from "@/utils/toast";
import type {
  ApiChatConversation,
  ApiChatMessage,
  ChatUnreadSummary,
  SendMessagePayload,
} from "@/types/chat";

function pickSocketRfqId(payload: unknown): number | null {
  const data = unwrapSocketPayload(payload);
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  const conversation =
    record.conversation && typeof record.conversation === "object"
      ? (record.conversation as Record<string, unknown>)
      : null;
  const rfq =
    record.rfq && typeof record.rfq === "object"
      ? (record.rfq as Record<string, unknown>)
      : null;
  for (const value of [
    record.rfq_id,
    record.rfqId,
    conversation?.rfq_id,
    conversation?.rfqId,
    rfq?.id,
  ]) {
    const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

interface ChatContextValue {
  socketStatus: ChatSocketStatus;
  unreadSummary: ChatUnreadSummary;
  refreshUnread: () => Promise<void>;
  /** Sync conversation list (incl. unread_count + rfq_id) for per-RFQ badges. */
  syncConversationsUnread: () => Promise<void>;
  /** Prefetch RFQ conversations so side-panel entry points can show unread badges. */
  hydrateRfqConversations: (rfqId: number) => Promise<void>;
  activeConversationId: number | null;
  setActiveConversationId: (id: number | null) => void;
  messagesByConversation: Record<number, ApiChatMessage[]>;
  typingByConversation: Record<number, boolean>;
  typingByRfq: Record<number, boolean>;
  presenceByUserId: Record<number, boolean>;
  loadMessages: (conversationId: number, page?: number, appendOlder?: boolean) => Promise<void>;
  /** Load the next older page for a conversation (handles API asc/desc quirks). */
  loadOlderMessages: (conversationId: number) => Promise<void>;
  hasMoreOlder: Record<number, boolean>;
  loadingMessages: boolean;
  sendText: (conversationId: number, content: string) => Promise<void>;
  sendTypedMessage: (conversationId: number, payload: SendMessagePayload) => Promise<void>;
  sendMedia: (
    conversationId: number,
    messageType: "IMAGE" | "DOCUMENT",
    file: File,
    content?: string
  ) => Promise<void>;
  setTyping: (conversationId: number, isTyping: boolean, rfqId?: number | null) => void;
  markRead: (
    conversationId: number,
    lastMessageId: number,
    remainingUnread?: number
  ) => Promise<void>;
  upsertConversationMeta: (conversation: ApiChatConversation) => void;
  conversationsMeta: Record<number, ApiChatConversation>;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

function mergeMessages(existing: ApiChatMessage[], incoming: ApiChatMessage[]): ApiChatMessage[] {
  const map = new Map<string | number, ApiChatMessage>();
  for (const msg of existing) {
    map.set(msg.client_id ?? msg.id, msg);
  }
  for (const msg of incoming) {
    // Replace optimistic temps when the real message arrives (REST or socket).
    if (msg.id > 0) {
      for (const [key, prev] of [...map.entries()]) {
        if (
          typeof key === "string" &&
          key.startsWith("tmp") &&
          prev.is_mine &&
          prev.message_type === msg.message_type &&
          (prev.content ?? "") === (msg.content ?? "") &&
          (prev.product_id ?? null) === (msg.product_id ?? null) &&
          (prev.quotation_id ?? null) === (msg.quotation_id ?? null)
        ) {
          map.delete(key);
        }
      }
    }
    const key = msg.client_id ?? msg.id;
    const prev = map.get(key) ?? (msg.id > 0 ? map.get(msg.id) : undefined);
    map.set(key, prev ? { ...prev, ...msg, send_status: msg.send_status ?? "sent" } : msg);
  }
  return Array.from(map.values()).sort((a, b) => {
    const ta = a.created_at ? Date.parse(a.created_at) : a.id;
    const tb = b.created_at ? Date.parse(b.created_at) : b.id;
    return ta - tb;
  });
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const { activeRole } = useActiveRole();
  const currentUserId = resolveAuthNumericUserId(user);
  const currentUserIdRef = useRef<number | null>(currentUserId);
  const activeRoleRef = useRef<"buyer" | "seller">(activeRole);
  const [socketStatus, setSocketStatus] = useState<ChatSocketStatus>("disconnected");
  const [unreadSummary, setUnreadSummary] = useState<ChatUnreadSummary>({ total_unread: 0 });
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [messagesByConversation, setMessagesByConversation] = useState<
    Record<number, ApiChatMessage[]>
  >({});
  const [typingByConversation, setTypingByConversation] = useState<Record<number, boolean>>({});
  const [typingByRfq, setTypingByRfq] = useState<Record<number, boolean>>({});
  const [presenceByUserId, setPresenceByUserId] = useState<Record<number, boolean>>({});
  const [hasMoreOlder, setHasMoreOlder] = useState<Record<number, boolean>>({});
  const [pageByConversation, setPageByConversation] = useState<Record<number, number>>({});
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [conversationsMeta, setConversationsMeta] = useState<Record<number, ApiChatConversation>>(
    {}
  );
  const activeIdRef = useRef<number | null>(null);
  const typingTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const typingActiveRef = useRef<Record<number, boolean>>({});
  const typingLastEmitRef = useRef<Record<number, number>>({});
  const remoteTypingTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const conversationsMetaRef = useRef<Record<number, ApiChatConversation>>({});
  const unreadSyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** How message pages are numbered for each conversation after the initial fetch. */
  const pagingModeRef = useRef<Record<number, "desc" | "asc-tail">>({});
  const pageByConversationRef = useRef<Record<number, number>>({});

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  useEffect(() => {
    activeRoleRef.current = activeRole;
  }, [activeRole]);

  useEffect(() => {
    activeIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    conversationsMetaRef.current = conversationsMeta;
  }, [conversationsMeta]);

  useEffect(() => {
    pageByConversationRef.current = pageByConversation;
  }, [pageByConversation]);

  // Re-attribute loaded messages when auth user id / role becomes available.
  useEffect(() => {
    if (currentUserId == null && !activeRole) return;
    setMessagesByConversation((prev) => {
      let changed = false;
      const next: Record<number, ApiChatMessage[]> = {};
      for (const [key, list] of Object.entries(prev)) {
        next[Number(key)] = list.map((msg) => {
          const owned = applyMessageOwnership(msg, currentUserId, activeRole);
          if (owned !== msg) changed = true;
          return owned;
        });
      }
      return changed ? next : prev;
    });
  }, [currentUserId, activeRole]);

  const refreshUnread = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadSummary({ total_unread: 0 });
      return;
    }
    try {
      const summary = await fetchUnreadSummary();
      setUnreadSummary(summary);
    } catch {
      /* badge is best-effort */
    }
  }, [isAuthenticated]);

  /** Pull conversation list so quotation cards get live per-RFQ unread + rfq_id. */
  const syncConversationsUnread = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { results } = await fetchConversations({ page: 1, limit: 50 });
      let systemInflation = 0;
      setConversationsMeta((prev) => {
        const next = { ...prev };
        for (const conversation of results) {
          const existing = next[conversation.id];
          const rawUnread = conversation.unread_count ?? 0;
          const effectiveUnread = effectiveConversationUnread(conversation);
          systemInflation += Math.max(0, rawUnread - effectiveUnread);
          next[conversation.id] = {
            ...existing,
            ...conversation,
            rfq_id: conversation.rfq_id ?? existing?.rfq_id ?? null,
            // Persist UI-facing unread so cards don't relight from SYSTEM events.
            unread_count: effectiveUnread,
          };
        }
        return next;
      });
      if (systemInflation > 0) {
        setUnreadSummary((prev) => ({
          ...prev,
          total_unread: Math.max(0, (prev.total_unread ?? 0) - systemInflation),
        }));
      }
    } catch {
      /* card badges are best-effort */
    }
  }, [isAuthenticated]);

  const scheduleConversationsUnreadSync = useCallback(() => {
    if (unreadSyncTimer.current) clearTimeout(unreadSyncTimer.current);
    unreadSyncTimer.current = setTimeout(() => {
      void syncConversationsUnread();
    }, 250);
  }, [syncConversationsUnread]);

  useEffect(() => {
    const unsub = subscribeChatSocketStatus(setSocketStatus);
    return unsub;
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectChatSocket();
      setUnreadSummary({ total_unread: 0 });
      setConversationsMeta({});
      return;
    }

    const s = connectChatSocket();
    void refreshUnread();
    void syncConversationsUnread();

    const onMessageNew = (payload: unknown) => {
      const message = normalizeChatMessage(
        unwrapSocketPayload(payload),
        currentUserIdRef.current
      );
      if (!message) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[chat] message:new ignored (normalize failed)", payload);
        }
        return;
      }
      const owned = applyMessageOwnership(
        message,
        currentUserIdRef.current,
        activeRoleRef.current
      );

      setMessagesByConversation((prev) => ({
        ...prev,
        [owned.conversation_id]: mergeMessages(prev[owned.conversation_id] ?? [], [
          { ...owned, send_status: "sent" },
        ]),
      }));

      // New message means the other party stopped typing.
      if (!owned.is_mine) {
        if (remoteTypingTimers.current[owned.conversation_id]) {
          clearTimeout(remoteTypingTimers.current[owned.conversation_id]);
          delete remoteTypingTimers.current[owned.conversation_id];
        }
        setTypingByConversation((prev) =>
          prev[owned.conversation_id] ? { ...prev, [owned.conversation_id]: false } : prev
        );
        const messageRfqId =
          pickSocketRfqId(payload) ??
          conversationsMetaRef.current[owned.conversation_id]?.rfq_id ??
          null;
        if (messageRfqId != null) {
          setTypingByRfq((prev) =>
            prev[messageRfqId] ? { ...prev, [messageRfqId]: false } : prev
          );
        }
      }

      // Only person messages bump unread — system/status events do not.
      const isIncomingUnread =
        activeIdRef.current !== owned.conversation_id &&
        countsAsUnreadChatMessage(owned);

      if (isIncomingUnread) {
        const socketRfqId = pickSocketRfqId(payload);
        const knownRfqId =
          conversationsMetaRef.current[owned.conversation_id]?.rfq_id ?? null;

        setConversationsMeta((prev) => {
          const existing = prev[owned.conversation_id];
          return {
            ...prev,
            [owned.conversation_id]: {
              ...(existing ?? { id: owned.conversation_id }),
              id: owned.conversation_id,
              rfq_id: existing?.rfq_id ?? socketRfqId ?? knownRfqId ?? null,
              unread_count: (existing?.unread_count ?? 0) + 1,
              last_message: owned,
              last_message_at: owned.created_at ?? existing?.last_message_at ?? null,
            },
          };
        });
        setUnreadSummary((prev) => ({
          ...prev,
          total_unread: (prev.total_unread ?? 0) + 1,
        }));
        void refreshUnread();
        scheduleConversationsUnreadSync();

        // Resolve rfq_id if we still don't have one (needed for quotation card badges).
        if (socketRfqId == null && knownRfqId == null) {
          void fetchConversation(owned.conversation_id)
            .then((conversation) => {
              setConversationsMeta((prev) => {
                const existing = prev[conversation.id];
                return {
                  ...prev,
                  [conversation.id]: {
                    ...existing,
                    ...conversation,
                    rfq_id: conversation.rfq_id ?? existing?.rfq_id ?? null,
                    unread_count: Math.max(
                      conversation.unread_count ?? 0,
                      existing?.unread_count ?? 0
                    ),
                  },
                };
              });
            })
            .catch(() => {
              /* ignore */
            });
        }
      }
    };

    const onTyping = (...args: unknown[]) => {
      const payload =
        args.length >= 2 && (typeof args[0] === "number" || typeof args[0] === "string")
          ? {
              conversation_id: args[0],
              is_typing: args[1],
              ...(args[2] && typeof args[2] === "object" ? (args[2] as object) : {}),
            }
          : args[0];

      let parsed = parseTypingPayload(payload, activeIdRef.current);

      if (!parsed && activeIdRef.current) {
        parsed = {
          conversationId: activeIdRef.current,
          userId: null,
          isTyping: true,
          rfqId: null,
        };
      }
      if (!parsed) return;

      // Do not filter by user_id — some backends attach the wrong id and that
      // was hiding legitimate peer typing events.

      const { conversationId, isTyping, userId, rfqId } = parsed;

      setTypingByConversation((prev) => {
        if (prev[conversationId] === isTyping) return prev;
        return { ...prev, [conversationId]: isTyping };
      });

      if (rfqId != null) {
        setTypingByRfq((prev) => {
          if (prev[rfqId] === isTyping) return prev;
          return { ...prev, [rfqId]: isTyping };
        });
      }

      if (isTyping && userId != null) {
        setPresenceByUserId((prev) =>
          prev[userId] === true ? prev : { ...prev, [userId]: true }
        );
      }

      if (remoteTypingTimers.current[conversationId]) {
        clearTimeout(remoteTypingTimers.current[conversationId]);
        delete remoteTypingTimers.current[conversationId];
      }

      if (isTyping) {
        remoteTypingTimers.current[conversationId] = setTimeout(() => {
          setTypingByConversation((prev) =>
            prev[conversationId] ? { ...prev, [conversationId]: false } : prev
          );
          if (rfqId != null) {
            setTypingByRfq((prev) => (prev[rfqId] ? { ...prev, [rfqId]: false } : prev));
          }
          delete remoteTypingTimers.current[conversationId];
        }, 5000);
      } else if (rfqId != null) {
        setTypingByRfq((prev) => (prev[rfqId] ? { ...prev, [rfqId]: false } : prev));
      }
    };

    const onMessageRead = (payload: unknown) => {
      const data = unwrapSocketPayload(payload);
      if (!data || typeof data !== "object") return;
      const record = data as Record<string, unknown>;
      const conversationId = Number(record.conversation_id);
      const lastReadId = Number(record.last_read_message_id ?? record.message_id);
      if (!Number.isFinite(conversationId) || !Number.isFinite(lastReadId)) return;

      setMessagesByConversation((prev) => {
        const list = prev[conversationId];
        if (!list) return prev;
        let changed = false;
        const next = list.map((msg) => {
          if (msg.id <= lastReadId && msg.is_mine && !msg.read_at) {
            changed = true;
            return { ...msg, read_at: new Date().toISOString() };
          }
          return msg;
        });
        if (!changed) return prev;
        return { ...prev, [conversationId]: next };
      });
    };

    const applyPresence = (userId: number, online: boolean) => {
      setPresenceByUserId((prev) => {
        if (prev[userId] === online) return prev;
        return { ...prev, [userId]: online };
      });
    };

    const onPresence = (payload: unknown) => {
      const parsed = parsePresencePayload(payload);
      if (!parsed) return;
      applyPresence(parsed.userId, parsed.online);
    };

    const seedPresenceFromConversation = (conversation: {
      other_party?: { user_id?: number; id?: number; is_online?: boolean | null } | null;
      buyer?: { user_id?: number; id?: number; is_online?: boolean | null } | null;
      seller?: { user_id?: number; id?: number; is_online?: boolean | null } | null;
    }) => {
      const parties = [conversation.other_party, conversation.buyer, conversation.seller];
      setPresenceByUserId((prev) => {
        let next = prev;
        for (const party of parties) {
          if (!party || typeof party.is_online !== "boolean") continue;
          const userId = Number(party.user_id ?? party.id);
          if (!Number.isFinite(userId) || userId <= 0) continue;
          if (next === prev) next = { ...prev };
          next[userId] = party.is_online;
        }
        return next;
      });
    };

    const onConversationUpdated = (payload: unknown) => {
      const conversation = normalizeChatConversation(unwrapSocketPayload(payload));
      if (conversation) {
        seedPresenceFromConversation(conversation);
        setConversationsMeta((prev) => {
          const existing = prev[conversation.id];
          return {
            ...prev,
            [conversation.id]: {
              ...existing,
              ...conversation,
              rfq_id: conversation.rfq_id ?? existing?.rfq_id ?? null,
            },
          };
        });
      }
      void refreshUnread();
      scheduleConversationsUnreadSync();
    };

    const onChatError = (payload: unknown) => {
      const data = unwrapSocketPayload(payload);
      const message =
        data && typeof data === "object" && "message" in data
          ? String((data as { message: unknown }).message)
          : typeof data === "string"
            ? data
            : "Chat error";
      console.error("[chat]", payload);
      showErrorToast(message);
    };

    const onJoinAck = (...args: unknown[]) => {
      const payload = args[0];
      if (process.env.NODE_ENV === "development") {
        console.info("[chat-socket] conversation:join", payload);
      }

      const data = unwrapSocketPayload(payload);
      if (data && typeof data === "object") {
        const record = data as Record<string, unknown>;
        const conversation = normalizeChatConversation(record.conversation ?? record);
        if (conversation) seedPresenceFromConversation(conversation);
      }

      // conversation:join ⇒ peer is online (buyer + seller).
      const updates = parseConversationPresencePayload(payload, {
        forceOnline: true,
        excludeUserId: currentUserIdRef.current,
      });
      for (const update of updates) {
        applyPresence(update.userId, true);
      }
    };

    const onLeave = (...args: unknown[]) => {
      const payload = args[0];
      if (process.env.NODE_ENV === "development") {
        console.info("[chat-socket] conversation:leave", payload);
      }
      // conversation:leave ⇒ peer is offline (buyer + seller).
      const updates = parseConversationPresencePayload(payload, {
        forceOnline: false,
        excludeUserId: currentUserIdRef.current,
      });
      for (const update of updates) {
        applyPresence(update.userId, false);
      }
    };

    // Full Buyer Chat (7) + Seller Chat (6) Postman Events union.
    const unsubscribers = [
      ...CHAT_SOCKET_LISTEN_EVENTS.map((event) => {
        switch (event) {
          case "message:new":
            return subscribeChatEvent(event, onMessageNew);
          case "typing:indicator":
            return subscribeChatEvent(event, onTyping);
          case "message:read":
            return subscribeChatEvent(event, onMessageRead);
          case "presence:update":
            return subscribeChatEvent(event, onPresence);
          case "conversation:updated":
            return subscribeChatEvent(event, onConversationUpdated);
          case "chat:error":
            return subscribeChatEvent(event, onChatError);
          case "conversation:join":
            return subscribeChatEvent(event, onJoinAck);
          default:
            return () => undefined;
        }
      }),
      subscribeChatEvent("conversation:leave", onLeave),
    ];

    return () => {
      if (unreadSyncTimer.current) clearTimeout(unreadSyncTimer.current);
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [isAuthenticated, refreshUnread, scheduleConversationsUnreadSync, syncConversationsUnread]);

  useEffect(() => {
    if (!activeConversationId) return;
    const conversationId = activeConversationId;
    joinConversation(conversationId);

    const userId = currentUserIdRef.current;
    if (userId) {
      void publishPresenceRelay({ conversationId, userId, online: true });
    }

    // Heartbeat while chat is open so the peer keeps seeing Online.
    const heartbeat = window.setInterval(() => {
      joinConversation(conversationId);
      const me = currentUserIdRef.current;
      if (me) {
        void publishPresenceRelay({ conversationId, userId: me, online: true });
      }
    }, 20_000);

    return () => {
      window.clearInterval(heartbeat);
      const me = currentUserIdRef.current;
      if (me) {
        void publishPresenceRelay({ conversationId, userId: me, online: false });
      }
      window.setTimeout(() => {
        if (activeIdRef.current !== conversationId) {
          leaveConversation(conversationId);
        }
      }, 400);
    };
  }, [activeConversationId]);

  // Poll presence relay — keeps Online/Offline in sync for buyer + seller on localhost.
  useEffect(() => {
    if (!isAuthenticated || !activeConversationId) return;

    let cancelled = false;
    const conversationId = activeConversationId;

    const tick = async () => {
      const me = currentUserIdRef.current ?? 0;
      const state = await fetchPresenceRelay(conversationId, me);
      if (cancelled || !state) return;
      for (const user of state.users) {
        if (!Number.isFinite(user.user_id) || user.user_id <= 0) continue;
        setPresenceByUserId((prev) => {
          if (prev[user.user_id] === user.is_online) return prev;
          return { ...prev, [user.user_id]: user.is_online };
        });
      }
    };

    void tick();
    const interval = window.setInterval(() => {
      void tick();
    }, 2000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [isAuthenticated, activeConversationId]);

  // Poll local typing relay so buyer/seller still see typing if socket broadcast fails.
  useEffect(() => {
    if (!isAuthenticated || !activeConversationId) return;

    let cancelled = false;
    const conversationId = activeConversationId;

    const tick = async () => {
      const me = currentUserIdRef.current ?? 0;
      const state = await fetchTypingRelay(conversationId, me);
      if (cancelled || !state?.is_typing) return;

      setTypingByConversation((prev) => {
        if (prev[conversationId]) return prev;
        return { ...prev, [conversationId]: true };
      });
      if (state.rfq_id != null) {
        const rfqId = state.rfq_id;
        setTypingByRfq((prev) => {
          if (prev[rfqId]) return prev;
          return { ...prev, [rfqId]: true };
        });
      }
      if (state.user_id != null) {
        setPresenceByUserId((prev) =>
          prev[state.user_id!] === true ? prev : { ...prev, [state.user_id!]: true }
        );
      }

      if (remoteTypingTimers.current[conversationId]) {
        clearTimeout(remoteTypingTimers.current[conversationId]);
      }
      remoteTypingTimers.current[conversationId] = setTimeout(() => {
        setTypingByConversation((prev) =>
          prev[conversationId] ? { ...prev, [conversationId]: false } : prev
        );
        if (state.rfq_id != null) {
          const rfqId = state.rfq_id;
          setTypingByRfq((prev) => (prev[rfqId] ? { ...prev, [rfqId]: false } : prev));
        }
        delete remoteTypingTimers.current[conversationId];
      }, 3500);
    };

    void tick();
    const interval = window.setInterval(() => {
      void tick();
    }, 800);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [isAuthenticated, activeConversationId]);

  const loadMessages = useCallback(
    async (conversationId: number, page = 1, appendOlder = false) => {
      setLoadingMessages(true);
      try {
      const limit = 30;
      const existingMode = pagingModeRef.current[conversationId];
      const requestOrder: "asc" | "desc" =
        appendOlder && existingMode === "asc-tail" ? "asc" : "desc";

      let batch = await fetchMessages(conversationId, {
        page,
        limit,
        order: requestOrder,
      });
      let rows = batch.results;
      let pagination = batch.pagination;
      let mode: "desc" | "asc-tail" = existingMode ?? "desc";

      // Initial open must show the newest messages. Some backends ignore `order`
      // and always return oldest-first on page 1 — jump to the last page then.
      if (!appendOlder && page === 1) {
        const looksAscending =
          rows.length >= 2 && rows[0].id < rows[rows.length - 1].id;

        if (looksAscending && pagination.totalPages > 1) {
          batch = await fetchMessages(conversationId, {
            page: pagination.totalPages,
            limit: pagination.limit || limit,
            order: "asc",
          });
          rows = batch.results;
          pagination = batch.pagination;
          mode = "asc-tail";
        } else {
          mode = "desc";
          if (!looksAscending) {
            rows = [...rows].reverse();
          }
        }
        pagingModeRef.current[conversationId] = mode;
      } else if (requestOrder === "desc") {
        const looksAscending =
          rows.length >= 2 && rows[0].id < rows[rows.length - 1].id;
        if (!looksAscending) {
          rows = [...rows].reverse();
        }
      }

        const owned = rows.map((msg) =>
          applyMessageOwnership(msg, currentUserIdRef.current, activeRoleRef.current)
        );

        setMessagesByConversation((prev) => ({
          ...prev,
          [conversationId]: appendOlder
            ? mergeMessages(owned, prev[conversationId] ?? [])
            : mergeMessages([], owned),
        }));

        const loadedPage =
          mode === "asc-tail" && !appendOlder ? pagination.page || page : page;
        setPageByConversation((prev) => ({ ...prev, [conversationId]: loadedPage }));
        setHasMoreOlder((prev) => ({
          ...prev,
          [conversationId]:
            mode === "asc-tail" ? loadedPage > 1 : loadedPage < pagination.totalPages,
        }));
      } finally {
        setLoadingMessages(false);
      }
    },
    []
  );

  const loadOlderMessages = useCallback(
    async (conversationId: number) => {
      if (loadingMessages) return;
      if (!hasMoreOlder[conversationId]) return;

      const mode = pagingModeRef.current[conversationId] ?? "desc";
      const current = pageByConversationRef.current[conversationId] ?? 1;
      const nextPage = mode === "asc-tail" ? current - 1 : current + 1;
      if (nextPage < 1) return;
      await loadMessages(conversationId, nextPage, true);
    },
    [hasMoreOlder, loadMessages, loadingMessages]
  );

  const upsertConversationMeta = useCallback((conversation: ApiChatConversation) => {
    setConversationsMeta((prev) => {
      const existing = prev[conversation.id];
      return {
        ...prev,
        [conversation.id]: {
          ...existing,
          ...conversation,
          rfq_id: conversation.rfq_id ?? existing?.rfq_id ?? null,
        },
      };
    });

    const parties = [conversation.other_party, conversation.buyer, conversation.seller];
    setPresenceByUserId((prev) => {
      let next = prev;
      for (const party of parties) {
        if (!party || typeof party.is_online !== "boolean") continue;
        const userId = Number(party.user_id ?? party.id);
        if (!Number.isFinite(userId) || userId <= 0) continue;
        if (next === prev) next = { ...prev };
        next[userId] = party.is_online;
      }
      return next;
    });
  }, []);

  const hydrateRfqConversations = useCallback(
    async (rfqId: number) => {
      if (!rfqId || !isAuthenticated) return;
      try {
        const { results } = await fetchRfqConversations(rfqId, { page: 1, limit: 20 });
        setConversationsMeta((prev) => {
          const next = { ...prev };
          for (const conversation of results) {
            const existing = next[conversation.id];
            next[conversation.id] = {
              ...existing,
              ...conversation,
              // Always stamp the RFQ we asked for so card badges can match.
              rfq_id: conversation.rfq_id ?? existing?.rfq_id ?? rfqId,
              unread_count: effectiveConversationUnread(conversation),
            };
          }
          return next;
        });
      } catch {
        /* unread badges are best-effort */
      }
    },
    [isAuthenticated]
  );

  const sendTypedMessage = useCallback(
    async (conversationId: number, payload: SendMessagePayload) => {
      const clientId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const optimistic: ApiChatMessage = {
        id: -Date.now(),
        conversation_id: conversationId,
        message_type: payload.message_type,
        content: payload.message_type === "TEXT" ? payload.content : null,
        product_id: payload.message_type === "PRODUCT" ? payload.product_id : null,
        quotation_id: payload.message_type === "QUOTATION" ? payload.quotation_id : null,
        sender_id: currentUserIdRef.current,
        is_mine: true,
        created_at: new Date().toISOString(),
        client_id: clientId,
        send_status: "sending",
      };

      setMessagesByConversation((prev) => ({
        ...prev,
        [conversationId]: mergeMessages(prev[conversationId] ?? [], [optimistic]),
      }));

      try {
        const saved = await sendMessage(conversationId, payload);
        const owned = applyMessageOwnership(
          { ...saved, is_mine: true, send_status: "sent" },
          currentUserIdRef.current,
          activeRoleRef.current
        );
        setMessagesByConversation((prev) => {
          const list = (prev[conversationId] ?? []).filter((m) => m.client_id !== clientId);
          return {
            ...prev,
            [conversationId]: mergeMessages(list, [
              { ...owned, is_mine: true, send_status: "sent" },
            ]),
          };
        });
      } catch (err) {
        setMessagesByConversation((prev) => ({
          ...prev,
          [conversationId]: (prev[conversationId] ?? []).map((m) =>
            m.client_id === clientId ? { ...m, send_status: "failed" } : m
          ),
        }));
        throw err;
      }
    },
    []
  );

  const sendText = useCallback(
    async (conversationId: number, content: string) => {
      await sendTypedMessage(conversationId, { message_type: "TEXT", content });
    },
    [sendTypedMessage]
  );

  const sendMedia = useCallback(
    async (
      conversationId: number,
      messageType: "IMAGE" | "DOCUMENT",
      file: File,
      content?: string
    ) => {
      const clientId = `tmp-media-${Date.now()}`;
      // No local blob preview — wait for backend media_url and show via /api/media proxy.
      const optimistic: ApiChatMessage = {
        id: -Date.now(),
        conversation_id: conversationId,
        message_type: messageType,
        content: content ?? null,
        file_name: file.name,
        file_size: file.size,
        media_url: null,
        file_url: null,
        sender_id: currentUserIdRef.current,
        is_mine: true,
        created_at: new Date().toISOString(),
        client_id: clientId,
        send_status: "sending",
      };
      setMessagesByConversation((prev) => ({
        ...prev,
        [conversationId]: mergeMessages(prev[conversationId] ?? [], [optimistic]),
      }));

      try {
        const saved = await sendMediaMessage(conversationId, {
          message_type: messageType,
          file,
          content,
        });
        let remoteUrl = saved.media_url || saved.file_url;
        if (
          messageType === "IMAGE" &&
          (!remoteUrl || remoteUrl.startsWith("blob:") || remoteUrl.startsWith("data:"))
        ) {
          const { resolveChatImageSrc } = await import("@/services/chatService");
          const resolved = await resolveChatImageSrc({
            ...saved,
            media_url: null,
            file_url: null,
          });
          if (resolved) remoteUrl = resolved;
        }
        const owned = applyMessageOwnership(
          {
            ...saved,
            is_mine: true,
            send_status: "sent",
            media_url: remoteUrl ?? null,
            file_url: remoteUrl ?? null,
            // Keep the name the user actually selected if API omits/replaces it.
            file_name:
              saved.file_name &&
              !/^document$/i.test(saved.file_name) &&
              !/^image$/i.test(saved.file_name)
                ? saved.file_name
                : file.name,
            file_size: saved.file_size ?? file.size,
          },
          currentUserIdRef.current,
          activeRoleRef.current
        );
        setMessagesByConversation((prev) => {
          const list = (prev[conversationId] ?? []).filter((m) => m.client_id !== clientId);
          return {
            ...prev,
            [conversationId]: mergeMessages(list, [
              { ...owned, is_mine: true, send_status: "sent" },
            ]),
          };
        });
      } catch (err) {
        setMessagesByConversation((prev) => ({
          ...prev,
          [conversationId]: (prev[conversationId] ?? []).map((m) =>
            m.client_id === clientId ? { ...m, send_status: "failed" } : m
          ),
        }));
        throw err;
      }
    },
    []
  );

  const setTyping = useCallback(
    (conversationId: number, isTyping: boolean, rfqId?: number | null) => {
      if (!Number.isFinite(conversationId) || conversationId <= 0) return;
      const userId = currentUserIdRef.current;

      if (typingTimers.current[conversationId]) {
        clearTimeout(typingTimers.current[conversationId]);
        delete typingTimers.current[conversationId];
      }

      if (!isTyping) {
        if (typingActiveRef.current[conversationId]) {
          emitTypingIndicator(conversationId, false, { rfqId });
          if (userId) {
            void publishTypingRelay({
              conversationId,
              userId,
              isTyping: false,
              rfqId,
            });
          }
          typingActiveRef.current[conversationId] = false;
          delete typingLastEmitRef.current[conversationId];
        }
        return;
      }

      const now = Date.now();
      const lastEmit = typingLastEmitRef.current[conversationId] ?? 0;
      const alreadyActive = Boolean(typingActiveRef.current[conversationId]);

      // Emit immediately, then refresh while typing continues.
      if (!alreadyActive || now - lastEmit >= 700) {
        emitTypingIndicator(conversationId, true, { rfqId });
        if (userId) {
          void publishTypingRelay({
            conversationId,
            userId,
            isTyping: true,
            rfqId,
          });
        }
        typingActiveRef.current[conversationId] = true;
        typingLastEmitRef.current[conversationId] = now;
      }

      typingTimers.current[conversationId] = setTimeout(() => {
        emitTypingIndicator(conversationId, false, { rfqId });
        if (userId) {
          void publishTypingRelay({
            conversationId,
            userId,
            isTyping: false,
            rfqId,
          });
        }
        typingActiveRef.current[conversationId] = false;
        delete typingLastEmitRef.current[conversationId];
        delete typingTimers.current[conversationId];
      }, 2500);
    },
    []
  );

  const markRead = useCallback(
    async (
      conversationId: number,
      lastMessageId: number,
      remainingUnread?: number
    ) => {
      try {
        // REST mark-read + socket `message:read` (Buyer/Seller Chat Postman events).
        emitMessageRead(conversationId, lastMessageId);
        await markConversationRead(conversationId, { last_read_message_id: lastMessageId });
        const nextUnread = Math.max(0, remainingUnread ?? 0);
        let cleared = 0;
        setConversationsMeta((prev) => {
          const existing = prev[conversationId];
          const prevUnread = existing?.unread_count ?? 0;
          cleared = Math.max(0, prevUnread - nextUnread);
          if (!existing) {
            return {
              ...prev,
              [conversationId]: { id: conversationId, unread_count: nextUnread },
            };
          }
          if (prevUnread === nextUnread) return prev;
          return {
            ...prev,
            [conversationId]: { ...existing, unread_count: nextUnread },
          };
        });
        if (cleared > 0) {
          setUnreadSummary((prev) => ({
            ...prev,
            total_unread: Math.max(0, (prev.total_unread ?? 0) - cleared),
          }));
        }
        // Re-sync after a beat, but SYSTEM inflation is stripped in syncConversationsUnread.
        void refreshUnread().then(() => {
          scheduleConversationsUnreadSync();
        });
      } catch {
        /* ignore */
      }
    },
    [refreshUnread, scheduleConversationsUnreadSync]
  );

  const value = useMemo<ChatContextValue>(
    () => ({
      socketStatus,
      unreadSummary,
      refreshUnread,
      syncConversationsUnread,
      hydrateRfqConversations,
      activeConversationId,
      setActiveConversationId,
      messagesByConversation,
      typingByConversation,
      typingByRfq,
      presenceByUserId,
      loadMessages,
      loadOlderMessages,
      hasMoreOlder,
      loadingMessages,
      sendText,
      sendTypedMessage,
      sendMedia,
      setTyping,
      markRead,
      upsertConversationMeta,
      conversationsMeta,
    }),
    [
      socketStatus,
      unreadSummary,
      refreshUnread,
      syncConversationsUnread,
      hydrateRfqConversations,
      activeConversationId,
      messagesByConversation,
      typingByConversation,
      typingByRfq,
      presenceByUserId,
      loadMessages,
      loadOlderMessages,
      hasMoreOlder,
      loadingMessages,
      sendText,
      sendTypedMessage,
      sendMedia,
      setTyping,
      markRead,
      upsertConversationMeta,
      conversationsMeta,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
