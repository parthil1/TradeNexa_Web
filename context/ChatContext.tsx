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
  coalesceIncomingSocketPayload,
  connectChatSocket,
  disconnectChatSocket,
  emitMessageRead,
  joinConversation,
  leaveConversation,
  subscribeChatEvent,
  subscribeChatSocketStatus,
  unwrapSocketPayload,
  type ChatSocketStatus,
} from "@/services/chatSocket";
import { CHAT_SOCKET_LISTEN_EVENTS } from "@/config/chatSocketEvents";
import {
  fetchConversation,
  fetchConversations,
  fetchMessages,
  fetchRfqConversations,
  fetchUnreadSummary,
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
  const [hasMoreOlder, setHasMoreOlder] = useState<Record<number, boolean>>({});
  const [pageByConversation, setPageByConversation] = useState<Record<number, number>>({});
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [conversationsMeta, setConversationsMeta] = useState<Record<number, ApiChatConversation>>(
    {}
  );
  const activeIdRef = useRef<number | null>(null);
  const conversationsMetaRef = useRef<Record<number, ApiChatConversation>>({});
  const unreadSyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Avoid REST seed overwriting a fresh socket unread bump (eventual consistency). */
  const lastLocalUnreadBumpAtRef = useRef(0);
  /** Dedupe unread bumps when message:new / receive_message both arrive. */
  const recentUnreadMessageIdsRef = useRef<Set<number>>(new Set());
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
      setUnreadSummary((prev) => {
        const nextTotal = summary.total_unread ?? 0;
        const prevTotal = prev.total_unread ?? 0;
        // Keep a recent live bump if REST briefly lags behind Socket.IO.
        if (
          prevTotal > nextTotal &&
          Date.now() - lastLocalUnreadBumpAtRef.current < 3000
        ) {
          return {
            ...summary,
            total_unread: prevTotal,
            as_buyer: summary.as_buyer ?? prev.as_buyer,
            as_seller: summary.as_seller ?? prev.as_seller,
          };
        }
        return summary;
      });
    } catch {
      /* badge is best-effort */
    }
  }, [isAuthenticated]);

  /** Pull conversation list so quotation cards get live per-RFQ unread + rfq_id. */
  const syncConversationsUnread = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { results } = await fetchConversations({
        page: 1,
        limit: 50,
        role: activeRoleRef.current,
      });
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
            // Keep API unread_count raw — effectiveConversationUnread at badge time
            // strips SYSTEM tip without double-counting.
            unread_count: rawUnread,
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

    // Re-seed unread from REST whenever the socket (re)connects, then rely on
    // live message:new / conversation:updated / messages_read for the nav badge.
    const unsubStatus = subscribeChatSocketStatus((next) => {
      if (next === "connected") {
        void refreshUnread();
      }
    });

    const onMessageNew = (...args: unknown[]) => {
      const payload = coalesceIncomingSocketPayload(args);
      const message = normalizeChatMessage(
        unwrapSocketPayload(payload),
        currentUserIdRef.current
      );
      if (!message) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[chat] message:new ignored (normalize failed)", payload, args);
        }
        // Still try conversation:updated-style unread via delayed REST if payload is opaque.
        void refreshUnread();
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
          {
            ...owned,
            send_status: "sent",
            // Own send echo must not inherit a false read_at from the payload.
            read_at: owned.is_mine ? null : owned.read_at,
          },
        ]),
      }));

      // Only person messages bump unread — system/status events do not.
      const isIncomingUnread =
        activeIdRef.current !== owned.conversation_id &&
        countsAsUnreadChatMessage(owned);

      if (isIncomingUnread) {
        // Dedupe if both alias + canonical events reach the handler in some setups.
        if (recentUnreadMessageIdsRef.current.has(owned.id)) {
          return;
        }
        recentUnreadMessageIdsRef.current.add(owned.id);
        if (recentUnreadMessageIdsRef.current.size > 200) {
          recentUnreadMessageIdsRef.current.clear();
        }

        const socketRfqId = pickSocketRfqId(payload);
        const knownRfqId =
          conversationsMetaRef.current[owned.conversation_id]?.rfq_id ?? null;

        lastLocalUnreadBumpAtRef.current = Date.now();
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
        setUnreadSummary((prev) => {
          const roleKey =
            activeRoleRef.current === "seller" ? "as_seller" : "as_buyer";
          return {
            ...prev,
            total_unread: (prev.total_unread ?? 0) + 1,
            [roleKey]: ((prev[roleKey] as number | undefined) ?? 0) + 1,
          };
        });

        // Resolve rfq_id if we still don't have one (needed for quotation card badges).
        // Socket-first: only one light GET for the missing RFQ link — no inbox/list refresh.
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

    const onMessageRead = (...args: unknown[]) => {
      const payload = coalesceIncomingSocketPayload(args);
      const data = unwrapSocketPayload(payload);
      if (!data || typeof data !== "object") return;
      const record = data as Record<string, unknown>;
      const conversationId = Number(record.conversation_id);
      const lastReadId = Number(
        record.last_read_message_id ?? record.message_id ?? record.last_read_id
      );
      if (!Number.isFinite(conversationId)) return;

      const readerRaw =
        record.reader_id ??
        record.user_id ??
        record.readerId ??
        (record.reader && typeof record.reader === "object"
          ? (record.reader as Record<string, unknown>).id
          : null);
      const readerId = Number(readerRaw);
      const me = currentUserIdRef.current;

      // Our own read (this tab, another tab, or socket mark_messages_read) — clear
      // unread for the nav badge. Do not paint blue ticks on our outgoing messages.
      if (me != null && Number.isFinite(readerId) && readerId > 0 && readerId === me) {
        let cleared = 0;
        setConversationsMeta((prev) => {
          const existing = prev[conversationId];
          const prevUnread = existing?.unread_count ?? 0;
          if (prevUnread <= 0 && existing) return prev;
          cleared = prevUnread;
          return {
            ...prev,
            [conversationId]: {
              ...(existing ?? { id: conversationId }),
              id: conversationId,
              unread_count: 0,
            },
          };
        });
        if (cleared > 0) {
          setUnreadSummary((prev) => {
            const roleKey =
              activeRoleRef.current === "seller" ? "as_seller" : "as_buyer";
            return {
              ...prev,
              total_unread: Math.max(0, (prev.total_unread ?? 0) - cleared),
              [roleKey]: Math.max(
                0,
                ((prev[roleKey] as number | undefined) ?? 0) - cleared
              ),
            };
          });
        }
        // Confirm with REST shortly after self-read so badge matches server.
        window.setTimeout(() => {
          void refreshUnread();
        }, 400);
        return;
      }

      if (!Number.isFinite(lastReadId)) return;

      // Guide: message:read / messages_read from the *peer* → blue ticks on our sends.
      if (!Number.isFinite(readerId) || readerId <= 0) {
        const readerRole = String(record.role ?? record.reader_role ?? "")
          .trim()
          .toLowerCase();
        if (readerRole && readerRole === activeRoleRef.current) return;
        if (!readerRole) return;
      }

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

    const onConversationUpdated = (...args: unknown[]) => {
      // Guide: conversation:updated → refresh inbox row from socket payload (no REST).
      const payload = coalesceIncomingSocketPayload(args);
      const conversation = normalizeChatConversation(unwrapSocketPayload(payload));
      if (!conversation) {
        void refreshUnread();
        return;
      }

      setConversationsMeta((prev) => {
        const existing = prev[conversation.id];
        const prevUnread = existing?.unread_count ?? 0;
        const nextUnread =
          conversation.unread_count != null
            ? effectiveConversationUnread(conversation)
            : prevUnread;
        const delta =
          conversation.unread_count != null ? nextUnread - prevUnread : 0;

        if (delta !== 0) {
          if (delta > 0) lastLocalUnreadBumpAtRef.current = Date.now();
          queueMicrotask(() => {
            setUnreadSummary((summary) => {
              const roleKey =
                activeRoleRef.current === "seller" ? "as_seller" : "as_buyer";
              return {
                ...summary,
                total_unread: Math.max(0, (summary.total_unread ?? 0) + delta),
                [roleKey]: Math.max(
                  0,
                  ((summary[roleKey] as number | undefined) ?? 0) + delta
                ),
              };
            });
          });
        }

        return {
          ...prev,
          [conversation.id]: {
            ...existing,
            ...conversation,
            rfq_id: conversation.rfq_id ?? existing?.rfq_id ?? null,
            unread_count: nextUnread,
            last_message: conversation.last_message ?? existing?.last_message ?? null,
            last_message_at:
              conversation.last_message_at ?? existing?.last_message_at ?? null,
          },
        };
      });
    };

    const onChatError = (...args: unknown[]) => {
      const payload = coalesceIncomingSocketPayload(args);
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

    const unsubscribers = CHAT_SOCKET_LISTEN_EVENTS.map((event) => {
      switch (event) {
        case "message:new":
          return subscribeChatEvent(event, onMessageNew);
        case "message:read":
          return subscribeChatEvent(event, onMessageRead);
        case "conversation:updated":
          return subscribeChatEvent(event, onConversationUpdated);
        case "chat:error":
          return subscribeChatEvent(event, onChatError);
        default:
          return () => undefined;
      }
    });

    return () => {
      if (unreadSyncTimer.current) clearTimeout(unreadSyncTimer.current);
      unsubStatus();
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [isAuthenticated, refreshUnread, syncConversationsUnread]);

  useEffect(() => {
    if (!activeConversationId) return;
    const conversationId = activeConversationId;
    joinConversation(conversationId);
    return () => {
      leaveConversation(conversationId);
    };
  }, [activeConversationId]);

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
              unread_count: conversation.unread_count ?? existing?.unread_count ?? 0,
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
              // Sent ≠ read — only peer `message:read` may set read_at.
              { ...owned, is_mine: true, send_status: "sent", read_at: null },
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
              { ...owned, is_mine: true, send_status: "sent", read_at: null },
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

  const markRead = useCallback(
    async (
      conversationId: number,
      lastMessageId: number,
      remainingUnread?: number
    ) => {
      // Guide: mark read via socket message:read (no REST /read).
      emitMessageRead(conversationId, lastMessageId);

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
    },
    []
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
      loadMessages,
      loadOlderMessages,
      hasMoreOlder,
      loadingMessages,
      sendText,
      sendTypedMessage,
      sendMedia,
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
      loadMessages,
      loadOlderMessages,
      hasMoreOlder,
      loadingMessages,
      sendText,
      sendTypedMessage,
      sendMedia,
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
