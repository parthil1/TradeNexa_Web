"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ChevronRight,
  FileText,
  ImageIcon,
  Loader2,
  MessageSquare,
  Package,
  Paperclip,
  Send,
} from "lucide-react";
import ChatMessageBubble from "@/components/chat/ChatMessageBubble";
import RfqStatusBadge from "@/components/rfq/RfqStatusBadge";
import { useChat } from "@/context/ChatContext";
import {
  ensureRfqConversation,
  getChatErrorMessage,
} from "@/services/chatService";
import { joinConversation } from "@/services/chatSocket";
import { countsAsUnreadChatMessage, isSystemChatMessage } from "@/utils/chatHelpers";
import { getInitials } from "@/utils/catalogHelpers";
import { showErrorToast } from "@/utils/toast";
import type { ApiChatConversation, ApiChatMessage, ChatRole } from "@/types/chat";
import type { ApiQuotation } from "@/types/rfq";

export interface ChatPanelProps {
  rfqId: number;
  role: ChatRole;
  rfqTitle?: string | null;
  rfqStatus?: string | null;
  /** Buyer must pass seller_id to create a conversation */
  sellerId?: number | null;
  otherPartyName?: string | null;
  /** Seller: quotations on this RFQ that can be attached */
  quotations?: ApiQuotation[];
  /** Buyer: product linked to the RFQ */
  productId?: number | null;
  productName?: string | null;
  className?: string;
  /** When true, omit outer border/shadow (parent card provides chrome) */
  embedded?: boolean;
}

const SENDER_GROUP_MS = 2 * 60 * 1000;

function humanizeChatBootError(raw: string, missingSellerId: boolean): string {
  if (missingSellerId) {
    return "This conversation can't start yet — seller information is missing from this quote.";
  }
  if (/same\s*user|buyer and seller cannot be the same/i.test(raw)) {
    return "This conversation can't be started right now — please contact support if this persists.";
  }
  if (/network|timeout|failed to fetch|ECONN|ENOTFOUND/i.test(raw)) {
    return "We couldn't open this chat due to a connection problem. Please try again in a moment.";
  }
  const trimmed = raw.trim();
  return (
    trimmed ||
    "This conversation can't be started right now — please contact support if this persists."
  );
}

function sameSenderRun(a: ApiChatMessage, b: ApiChatMessage): boolean {
  if (isSystemChatMessage(a) || isSystemChatMessage(b)) return false;
  if (Boolean(a.is_mine) !== Boolean(b.is_mine)) return false;
  if (a.is_mine) {
    /* keep grouping for own messages within time window */
  } else if (a.sender_id != null && b.sender_id != null && a.sender_id !== b.sender_id) {
    return false;
  }
  const ta = a.created_at ? Date.parse(a.created_at) : NaN;
  const tb = b.created_at ? Date.parse(b.created_at) : NaN;
  if (Number.isFinite(ta) && Number.isFinite(tb) && Math.abs(tb - ta) > SENDER_GROUP_MS) {
    return false;
  }
  return true;
}

export default function ChatPanel({
  rfqId,
  role,
  rfqTitle,
  rfqStatus,
  sellerId,
  otherPartyName,
  quotations = [],
  productId,
  productName: _productName,
  className = "",
  embedded = false,
}: ChatPanelProps) {
  const {
    socketStatus,
    setActiveConversationId,
    messagesByConversation,
    typingByConversation,
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
  } = useChat();

  const [bootLoading, setBootLoading] = useState(true);
  const [bootError, setBootError] = useState<string | null>(null);
  const [missingSellerId, setMissingSellerId] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [headerName, setHeaderName] = useState(otherPartyName || "Chat");
  const [otherUserId, setOtherUserId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [quotePickerOpen, setQuotePickerOpen] = useState(false);
  const [unreadBannerCount, setUnreadBannerCount] = useState(0);
  const [unreadStartMessageId, setUnreadStartMessageId] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const unreadAnchorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const attachRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const blurTypingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stickToBottom = useRef(true);
  const sendingRef = useRef(false);
  const lastMarkedReadIdRef = useRef<number | null>(null);
  const initialScrollDoneRef = useRef(false);
  const markReadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const messages = conversationId ? messagesByConversation[conversationId] ?? [] : [];
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const isTyping = conversationId ? Boolean(typingByConversation[conversationId]) : false;
  const disconnected = socketStatus !== "connected";
  const livePresence =
    otherUserId != null && Object.prototype.hasOwnProperty.call(presenceByUserId, otherUserId)
      ? presenceByUserId[otherUserId]
      : undefined;
  const metaParty =
    conversationId != null ? conversationsMeta[conversationId]?.other_party : null;
  const metaPresence =
    typeof metaParty?.is_online === "boolean" ? metaParty.is_online : undefined;
  const online =
    typeof livePresence === "boolean"
      ? livePresence
      : typeof metaPresence === "boolean"
        ? metaPresence
        : false;
  const presenceLabel = online ? "Online" : "Offline";

  function captureUnreadBanner(conversation: { unread_count?: number | null }) {
    const count = conversation.unread_count ?? 0;
    setUnreadBannerCount(count > 0 ? count : 0);
    setUnreadStartMessageId(null);
  }

  /** Mark messages as read only after they've been scrolled into view. */
  const markVisibleMessagesRead = useCallback(() => {
    const el = listRef.current;
    if (!el || !conversationId) return;

    const list = messagesRef.current;
    if (list.length === 0) return;

    const containerRect = el.getBoundingClientRect();
    let maxVisibleId = 0;

    el.querySelectorAll<HTMLElement>("[data-chat-message-id]").forEach((node) => {
      const id = Number(node.dataset.chatMessageId);
      if (!Number.isFinite(id) || id <= 0) return;
      const rect = node.getBoundingClientRect();
      const visible =
        rect.bottom > containerRect.top + 12 && rect.top < containerRect.bottom - 12;
      if (visible && id > maxVisibleId) maxVisibleId = id;
    });

    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (nearBottom) {
      for (const msg of list) {
        if (msg.id > maxVisibleId) maxVisibleId = msg.id;
      }
    }

    if (maxVisibleId <= 0) return;
    if (
      lastMarkedReadIdRef.current != null &&
      maxVisibleId <= lastMarkedReadIdRef.current
    ) {
      return;
    }

    lastMarkedReadIdRef.current = maxVisibleId;

    let stillUnread = 0;
    for (const msg of list) {
      // System/status events never keep the unread badge alive.
      if (!countsAsUnreadChatMessage(msg)) continue;
      if (unreadStartMessageId != null && msg.id < unreadStartMessageId) continue;
      if (msg.id > maxVisibleId) stillUnread += 1;
    }

    void markRead(conversationId, maxVisibleId, stillUnread);

    setUnreadBannerCount((prev) => {
      if (prev <= 0 && stillUnread <= 0) return prev;
      if (stillUnread <= 0) {
        setUnreadStartMessageId(null);
        return 0;
      }
      return stillUnread;
    });
  }, [conversationId, markRead, unreadStartMessageId]);

  const scheduleMarkVisibleRead = useCallback(() => {
    if (markReadTimerRef.current) clearTimeout(markReadTimerRef.current);
    markReadTimerRef.current = setTimeout(() => {
      markVisibleMessagesRead();
    }, 180);
  }, [markVisibleMessagesRead]);

  const messageLayout = useMemo(
    () =>
      messages.map((msg, index) => {
        const prev = index > 0 ? messages[index - 1] : null;
        const next = index < messages.length - 1 ? messages[index + 1] : null;
        const isSystem = isSystemChatMessage(msg);
        const startsRun = !prev || !sameSenderRun(prev, msg);
        const endsRun = !next || !sameSenderRun(msg, next);
        const showAvatar = !isSystem && !msg.is_mine && startsRun;

        let gapClass = index === 0 ? "" : "mt-1";
        if (prev) {
          const prevSystem = isSystemChatMessage(prev);
          if (prevSystem !== isSystem) gapClass = "mt-5";
          else if (isSystem && prevSystem) gapClass = "mt-2";
          else if (!sameSenderRun(prev, msg)) gapClass = "mt-3.5";
          else gapClass = "mt-1";
        }

        return {
          showAvatar,
          /** Always show time; emphasize last-in-run (others still visible). */
          showTimestamp: true,
          isLastInRun: isSystem || endsRun,
          gapClass,
        };
      }),
    [messages]
  );

  useEffect(() => {
    let cancelled = false;

    async function openConversation(conversation: ApiChatConversation) {
      setConversationId(conversation.id);
      upsertConversationMeta(conversation);
      setActiveConversationId(conversation.id);
      captureUnreadBanner(conversation);

      const other =
        conversation.other_party ??
        (role === "buyer" ? conversation.seller : conversation.buyer);
      setHeaderName(
        otherPartyName ||
          other?.company_name ||
          other?.name ||
          (role === "buyer" ? "Seller" : "Buyer")
      );
      setOtherUserId(other?.user_id ?? other?.id ?? null);
      await loadMessages(conversation.id, 1, false);
    }

    async function boot() {
      setBootLoading(true);
      setBootError(null);
      setMissingSellerId(false);
      setUnreadBannerCount(0);
      setUnreadStartMessageId(null);
      try {
        if (role === "buyer" && !sellerId) {
          setMissingSellerId(true);
          setBootError(humanizeChatBootError("", true));
          setConversationId(null);
          return;
        }

        // Both roles start (or open) the conversation directly.
        const conversation = await ensureRfqConversation({
          rfqId,
          role,
          sellerId: sellerId ?? undefined,
        });
        if (cancelled) return;
        await openConversation(conversation);
      } catch (err) {
        if (!cancelled) {
          console.error("[chat] open conversation failed:", err);
          const msg = getChatErrorMessage(err, "Unable to open chat for this RFQ");
          if (/seller/i.test(msg) && /missing|required|seller_id/i.test(msg)) {
            setMissingSellerId(true);
            setBootError(humanizeChatBootError(msg, true));
          } else {
            setBootError(humanizeChatBootError(msg, false));
          }
        }
      } finally {
        if (!cancelled) setBootLoading(false);
      }
    }

    void boot();

    return () => {
      cancelled = true;
      setActiveConversationId(null);
    };
  }, [
    rfqId,
    role,
    sellerId,
    otherPartyName,
    loadMessages,
    setActiveConversationId,
    upsertConversationMeta,
  ]);

  useEffect(() => {
    if (!conversationId) return;
    // Make sure the socket room is joined as soon as chat is ready.
    joinConversation(conversationId);
    return () => {
      if (blurTypingTimerRef.current) clearTimeout(blurTypingTimerRef.current);
      setTyping(conversationId, false);
    };
  }, [conversationId, setTyping]);

  useEffect(() => {
    lastMarkedReadIdRef.current = null;
    initialScrollDoneRef.current = false;
    stickToBottom.current = true;
    if (markReadTimerRef.current) {
      clearTimeout(markReadTimerRef.current);
      markReadTimerRef.current = null;
    }
  }, [conversationId]);

  // Resolve where the WhatsApp-style "N unread messages" divider should sit.
  useEffect(() => {
    if (!unreadBannerCount || messages.length === 0) {
      setUnreadStartMessageId(null);
      return;
    }
    let remaining = unreadBannerCount;
    let startId: number | null = null;
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      // Only person messages — system status events are not "unread chat".
      if (!countsAsUnreadChatMessage(msg)) continue;
      remaining -= 1;
      startId = msg.id;
      if (remaining === 0) break;
    }
    // API unread may be system-only; no human unread → no divider.
    setUnreadStartMessageId(startId);
  }, [messages, unreadBannerCount]);

  // If the thread's unread is only system/status events, clear it on open.
  useEffect(() => {
    if (bootLoading || !conversationId || messages.length === 0) return;
    const hasHumanUnread = messages.some(countsAsUnreadChatMessage);
    if (hasHumanUnread) return;

    let latestId = 0;
    for (const msg of messages) {
      if (msg.id > latestId) latestId = msg.id;
    }
    if (latestId <= 0) return;
    if (lastMarkedReadIdRef.current != null && latestId <= lastMarkedReadIdRef.current) {
      if (unreadBannerCount > 0) setUnreadBannerCount(0);
      return;
    }

    lastMarkedReadIdRef.current = latestId;
    void markRead(conversationId, latestId, 0);
    setUnreadBannerCount(0);
    setUnreadStartMessageId(null);
  }, [bootLoading, conversationId, messages, unreadBannerCount, markRead]);

  // Open position: all read → last message; has unread → first unread.
  useEffect(() => {
    if (bootLoading || messages.length === 0 || initialScrollDoneRef.current) return;

    const hasIncoming = messages.some(countsAsUnreadChatMessage);
    // Wait until unread anchor id is known (when there are human msgs to mark).
    if (unreadBannerCount > 0 && hasIncoming && unreadStartMessageId == null) return;

    let cancelled = false;
    const frame = window.requestAnimationFrame(() => {
      // Second frame: unread divider is mounted and measurable.
      window.requestAnimationFrame(() => {
        if (cancelled || initialScrollDoneRef.current) return;

        if (
          unreadBannerCount > 0 &&
          unreadStartMessageId != null &&
          unreadAnchorRef.current
        ) {
          stickToBottom.current = false;
          unreadAnchorRef.current.scrollIntoView({ behavior: "auto", block: "start" });
        } else {
          stickToBottom.current = true;
          bottomRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
        }
        initialScrollDoneRef.current = true;
        // Mark only what's currently on screen (not the whole thread).
        scheduleMarkVisibleRead();
      });
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [
    bootLoading,
    messages,
    unreadBannerCount,
    unreadStartMessageId,
    conversationId,
    scheduleMarkVisibleRead,
  ]);

  // After open: keep pinned to bottom only when user is already near the end / just sent.
  useEffect(() => {
    if (!initialScrollDoneRef.current) return;
    if (!stickToBottom.current) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    scheduleMarkVisibleRead();
  }, [messages.length, isTyping, scheduleMarkVisibleRead]);

  useEffect(() => {
    return () => {
      if (markReadTimerRef.current) clearTimeout(markReadTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!attachOpen) {
      setQuotePickerOpen(false);
      return;
    }
    const onPointer = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (attachRef.current?.contains(target)) return;
      setAttachOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
    };
  }, [attachOpen]);

  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el || !conversationId) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    stickToBottom.current = nearBottom;
    scheduleMarkVisibleRead();

    if (el.scrollTop < 48 && hasMoreOlder[conversationId] && !loadingMessages) {
      void loadOlderMessages(conversationId);
    }
  }, [
    conversationId,
    hasMoreOlder,
    loadingMessages,
    loadOlderMessages,
    scheduleMarkVisibleRead,
  ]);

  async function handleSend() {
    if (!conversationId || !draft.trim() || sendingRef.current) return;
    const content = draft.trim();
    sendingRef.current = true;
    setDraft("");
    setTyping(conversationId, false);
    setSending(true);
    stickToBottom.current = true;
    try {
      await sendText(conversationId, content);
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : "Failed to send");
      setDraft(content);
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  async function handleAttachProduct() {
    if (!conversationId || !productId) return;
    setAttachOpen(false);
    try {
      await sendTypedMessage(conversationId, {
        message_type: "PRODUCT",
        product_id: productId,
      });
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : "Failed to attach product");
    }
  }

  async function handleAttachQuotation(quotationId: number) {
    if (!conversationId) return;
    setAttachOpen(false);
    setQuotePickerOpen(false);
    try {
      await sendTypedMessage(conversationId, {
        message_type: "QUOTATION",
        quotation_id: quotationId,
      });
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : "Failed to attach quotation");
    }
  }

  async function handleFile(file: File | undefined, messageType: "IMAGE" | "DOCUMENT") {
    if (!file || !conversationId) return;
    setAttachOpen(false);
    try {
      await sendMedia(conversationId, messageType, file);
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : "Failed to upload file");
    }
  }

  const shellClass = embedded
    ? `flex h-[min(560px,70vh)] flex-col overflow-hidden bg-white ${className}`
    : `flex h-[min(560px,70vh)] flex-col overflow-hidden rounded-2xl border border-[#E8ECF0] bg-white shadow-sm ${className}`;

  const chatUnavailable = Boolean(bootError);
  const canCompose =
    Boolean(conversationId) && !bootLoading && !chatUnavailable;
  /** Keep composer usable while socket reconnects so typing:indicator can still emit. */
  const composerDisabled = !canCompose;
  const errorCopy = humanizeChatBootError(bootError ?? "", missingSellerId);

  return (
    <section className={shellClass}>
      <header className="flex items-start justify-between gap-3 border-b border-[#E8ECF0] px-4 py-3.5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="relative shrink-0">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E3F2FD] text-base font-bold text-[#1565C0]">
              {getInitials(headerName)}
            </span>
            <span
              className={`absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full ring-[2.5px] ring-white ${
                online ? "bg-emerald-500" : "bg-[#B0BEC5]"
              }`}
              title={presenceLabel}
              aria-label={presenceLabel}
            />
          </div>
          <div className="min-w-0 pt-0.5">
            <h3 className="truncate text-sm font-bold text-[#0D1B2A]">{headerName}</h3>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
              <p
                className={`text-xs font-semibold ${
                  isTyping
                    ? "text-[#1565C0]"
                    : online
                      ? "text-emerald-600"
                      : "text-[#90A4AE]"
                }`}
              >
                {isTyping ? "typing..." : presenceLabel}
              </p>
              <span className="text-[#CFD8DC]">·</span>
              <p className="truncate text-xs text-[#90A4AE]">
                {rfqTitle ? `RFQ · ${rfqTitle}` : `RFQ #${rfqId}`}
              </p>
              {disconnected && !chatUnavailable ? (
                <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200">
                  Reconnecting...
                </span>
              ) : null}
            </div>
          </div>
        </div>
        {rfqStatus ? (
          <RfqStatusBadge status={rfqStatus} className="shrink-0 px-3 py-1.5 text-[11px]" />
        ) : null}
      </header>

      <div
        ref={listRef}
        onScroll={conversationId && !bootLoading && !chatUnavailable ? handleScroll : undefined}
        className={`min-h-0 flex-1 bg-[#FAFBFC] ${
          chatUnavailable || bootLoading || messages.length === 0
            ? "flex flex-col"
            : "overflow-y-auto px-4 py-4"
        }`}
      >
        {bootLoading ? (
          <div className="relative flex h-full flex-1 flex-col justify-end gap-3 px-4 pb-6">
            <div className="mr-auto h-10 w-2/3 animate-pulse rounded-2xl bg-[#E8ECF0]" />
            <div className="ml-auto h-10 w-1/2 animate-pulse rounded-2xl bg-[#E3F2FD]" />
            <div className="mr-auto h-14 w-3/5 animate-pulse rounded-2xl bg-[#E8ECF0]" />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-[#FAFBFC]/70 text-sm text-[#546E7A]">
              <Loader2 className="h-5 w-5 animate-spin text-[#1565C0]" />
              Opening chat...
            </div>
          </div>
        ) : chatUnavailable ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
            <div className="relative">
              <MessageSquare className="h-10 w-10 text-amber-500/80" strokeWidth={1.5} />
              <AlertCircle className="absolute -right-1.5 -top-1.5 h-5 w-5 fill-amber-50 text-amber-500" />
            </div>
            <p className="mt-4 text-sm font-bold text-[#0D1B2A]">Chat unavailable</p>
            <p className="mt-2 max-w-xs text-xs leading-relaxed text-[#546E7A]">{errorCopy}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white ring-1 ring-[#E8ECF0]">
              <MessageSquare className="h-7 w-7 text-[#CFD8DC]" strokeWidth={1.5} />
            </div>
            <p className="mt-3 text-sm font-bold text-[#0D1B2A]">No messages yet</p>
            <p className="mt-1 text-xs text-[#546E7A]">
              {role === "buyer" ? "Say hello to start the conversation." : "Start the conversation."}
            </p>
          </div>
        ) : (
          <>
            {loadingMessages ? (
              <div className="flex justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin text-[#1565C0]" />
              </div>
            ) : null}
            {messages.map((message, index) => (
              <React.Fragment key={message.client_id ?? message.id}>
                {unreadStartMessageId != null &&
                message.id === unreadStartMessageId &&
                unreadBannerCount > 0 ? (
                  <div
                    ref={unreadAnchorRef}
                    className="my-3 flex items-center gap-2 px-1"
                  >
                    <span className="h-px flex-1 bg-[#E0E6ED]" />
                    <span className="shrink-0 rounded-full bg-[#25D366] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                      {unreadBannerCount > 99 ? "99+" : unreadBannerCount} unread message
                      {unreadBannerCount === 1 ? "" : "s"}
                    </span>
                    <span className="h-px flex-1 bg-[#E0E6ED]" />
                  </div>
                ) : null}
                <div data-chat-message-id={message.id > 0 ? message.id : undefined}>
                  <ChatMessageBubble
                    message={message}
                    showAvatar={messageLayout[index]?.showAvatar}
                    showTimestamp={messageLayout[index]?.showTimestamp}
                    avatarName={headerName}
                    className={messageLayout[index]?.gapClass}
                  />
                </div>
              </React.Fragment>
            ))}
            {isTyping ? (
              <div
                className="mt-2 flex items-end gap-2 pl-1"
                aria-live="polite"
                aria-label="Typing"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ECEFF1] text-[10px] font-bold text-[#546E7A]">
                  {getInitials(headerName)}
                </div>
                <div className="inline-flex items-center gap-1 rounded-2xl rounded-bl-md bg-[#F4F6F9] px-3 py-2.5">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#90A4AE] [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#90A4AE] [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#90A4AE]" />
                </div>
              </div>
            ) : null}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {canCompose ? (
        <div className="relative border-t border-[#E8ECF0] bg-white px-3 py-3">
          <div ref={attachRef} className="flex items-end gap-2">
            {attachOpen ? (
              <div className="absolute bottom-[calc(100%-4px)] left-0 z-20 w-[240px] overflow-hidden rounded-xl border border-[#E8ECF0] bg-white py-1 shadow-lg shadow-slate-900/10">
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-medium text-[#0D1B2A] transition hover:bg-[#F4F6F9]"
                >
                  <ImageIcon className="h-5 w-5 shrink-0 text-[#546E7A]" />
                  Photo
                </button>
                <button
                  type="button"
                  onClick={() => docInputRef.current?.click()}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-medium text-[#0D1B2A] transition hover:bg-[#F4F6F9]"
                >
                  <FileText className="h-5 w-5 shrink-0 text-[#546E7A]" />
                  Document
                </button>
                {role === "buyer" && productId ? (
                  <button
                    type="button"
                    onClick={() => void handleAttachProduct()}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-medium text-[#0D1B2A] transition hover:bg-[#F4F6F9]"
                  >
                    <Package className="h-5 w-5 shrink-0 text-[#546E7A]" />
                    Attach Product
                  </button>
                ) : null}
                {role === "seller" && quotations.length === 1 ? (
                  <button
                    type="button"
                    onClick={() => void handleAttachQuotation(quotations[0].id)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-medium text-[#0D1B2A] transition hover:bg-[#F4F6F9]"
                  >
                    <MessageSquare className="h-5 w-5 shrink-0 text-[#546E7A]" />
                    Attach Quote #{quotations[0].id}
                  </button>
                ) : null}
                {role === "seller" && quotations.length > 1 ? (
                  <div>
                    <button
                      type="button"
                      onClick={() => setQuotePickerOpen((v) => !v)}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-medium text-[#0D1B2A] transition hover:bg-[#F4F6F9]"
                    >
                      <MessageSquare className="h-5 w-5 shrink-0 text-[#546E7A]" />
                      <span className="flex-1">Attach Quotation</span>
                      <ChevronRight
                        className={`h-4 w-4 text-[#90A4AE] transition ${quotePickerOpen ? "rotate-90" : ""}`}
                      />
                    </button>
                    {quotePickerOpen ? (
                      <div className="border-t border-[#F0F2F5] bg-[#FAFBFC] py-1">
                        {quotations.map((q) => (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() => void handleAttachQuotation(q.id)}
                            className="flex w-full px-3 py-2 pl-11 text-left text-xs font-semibold text-[#546E7A] transition hover:bg-[#F4F6F9] hover:text-[#0D1B2A]"
                          >
                            Quote #{q.id}
                            {q.price != null ? ` · ₹${q.price.toLocaleString("en-IN")}` : ""}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => setAttachOpen((v) => !v)}
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition ${
                attachOpen
                  ? "border-[#1565C0]/40 bg-[#E3F2FD] text-[#1565C0]"
                  : "border-[#E0E6ED] text-[#546E7A] hover:bg-[#F4F6F9]"
              }`}
              aria-label="Attach"
              aria-expanded={attachOpen}
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <textarea
              ref={composerRef}
              value={draft}
              disabled={composerDisabled}
              onChange={(e) => {
                const value = e.target.value;
                setDraft(value);
                if (!conversationId || composerDisabled) return;
                if (blurTypingTimerRef.current) {
                  clearTimeout(blurTypingTimerRef.current);
                  blurTypingTimerRef.current = null;
                }
                // Buyer + seller both emit Postman `typing:indicator` over Socket.IO.
                setTyping(conversationId, value.trim().length > 0);
              }}
              onBlur={() => {
                if (!conversationId) return;
                // Delay stop so clicking Send / Attach doesn't kill the indicator early.
                if (blurTypingTimerRef.current) clearTimeout(blurTypingTimerRef.current);
                blurTypingTimerRef.current = setTimeout(() => {
                  if (document.activeElement === composerRef.current) return;
                  setTyping(conversationId, false);
                  blurTypingTimerRef.current = null;
                }, 200);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              rows={1}
              placeholder={disconnected ? "Reconnecting..." : "Type a message..."}
              className="max-h-28 min-h-[48px] flex-1 resize-none rounded-xl border border-[#E0E6ED] bg-[#FAFBFC] px-3.5 py-3 text-sm text-[#0D1B2A] outline-none transition focus:border-[#1565C0] focus:ring-2 focus:ring-[#1565C0]/15 disabled:opacity-50"
            />
            <button
              type="button"
              disabled={!draft.trim() || sending || composerDisabled}
              onClick={() => void handleSend()}
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition ${
                draft.trim() && !sending && !composerDisabled
                  ? "bg-[#1565C0] text-white hover:bg-[#1255A8]"
                  : "cursor-not-allowed bg-[#E8ECF0] text-[#90A4AE]"
              }`}
              aria-label="Send"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>

          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              void handleFile(e.target.files?.[0], "IMAGE");
              e.target.value = "";
            }}
          />
          <input
            ref={docInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,application/pdf"
            className="hidden"
            onChange={(e) => {
              void handleFile(e.target.files?.[0], "DOCUMENT");
              e.target.value = "";
            }}
          />
        </div>
      ) : null}
    </section>
  );
}
