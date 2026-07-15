"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
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
  ensureInquiryConversation,
  ensureRfqConversation,
  fetchConversation,
  getChatErrorMessage,
} from "@/services/chatService";
import { openInquiryChat } from "@/services/inquiryService";
import { joinConversation } from "@/services/chatSocket";
import { conversationCounterpartyLogo, countsAsUnreadChatMessage, isSystemChatMessage } from "@/utils/chatHelpers";
import { getInitials, resolveImageUrl } from "@/utils/catalogHelpers";
import { showErrorToast } from "@/utils/toast";
import type { ApiChatConversation, ApiChatMessage, ChatRole } from "@/types/chat";
import type { ApiQuotation } from "@/types/rfq";

export interface ChatPanelProps {
  /** Open an existing pair thread directly (preferred after inquiry create). */
  conversationId?: number | null;
  /** Resolve via POST /inquiries/:id/chat or POST /chats/conversations { inquiry_id }. */
  inquiryId?: number | null;
  /** RFQ path — buyer needs sellerId when creating. */
  rfqId?: number | null;
  role: ChatRole;
  /** RFQ status badge in the chat header (optional). */
  rfqStatus?: string | null;
  /** Buyer must pass seller_id to create an RFQ conversation */
  sellerId?: number | null;
  otherPartyName?: string | null;
  /** Seller: quotations on this RFQ that can be attached */
  quotations?: ApiQuotation[];
  /** Buyer: product linked to the RFQ / inquiry */
  productId?: number | null;
  productName?: string | null;
  className?: string;
  /** When true, omit outer border/shadow (parent card provides chrome) */
  embedded?: boolean;
  /** Hide the counterparty avatar/name header (e.g. chats inbox already shows who is selected). */
  hideHeader?: boolean;
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
  conversationId: initialConversationId = null,
  inquiryId = null,
  rfqId = null,
  role,
  rfqStatus,
  sellerId,
  otherPartyName,
  quotations = [],
  productId,
  className = "",
  embedded = false,
  hideHeader = false,
}: ChatPanelProps) {
  const {
    socketStatus,
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
  } = useChat();

  const [bootLoading, setBootLoading] = useState(true);
  const [bootError, setBootError] = useState<string | null>(null);
  const [missingSellerId, setMissingSellerId] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [headerName, setHeaderName] = useState(otherPartyName || "Chat");
  const [headerLogo, setHeaderLogo] = useState<string | null>(null);
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
  const stickToBottom = useRef(true);
  const sendingRef = useRef(false);
  const lastMarkedReadIdRef = useRef<number | null>(null);
  const initialScrollDoneRef = useRef(false);
  const markReadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const messages = conversationId ? messagesByConversation[conversationId] ?? [] : [];
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const disconnected = socketStatus !== "connected";

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

    // Prefer the latest *incoming* visible id for socket message:read — own sends
    // don't need a self-read cursor (and their echo was painting false blue ticks).
    let readThroughId = 0;
    for (const msg of list) {
      if (msg.id <= 0 || msg.id > maxVisibleId) continue;
      if (msg.is_mine) continue;
      if (msg.id > readThroughId) readThroughId = msg.id;
    }
    if (readThroughId <= 0) {
      // No incoming messages in view — nothing to mark read for.
      lastMarkedReadIdRef.current = maxVisibleId;
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

    void markRead(conversationId, readThroughId, stillUnread);

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
      setHeaderLogo(conversationCounterpartyLogo(conversation, role));
      await loadMessages(conversation.id, 1, false);
    }

    async function boot() {
      setBootLoading(true);
      setBootError(null);
      setMissingSellerId(false);
      setUnreadBannerCount(0);
      setUnreadStartMessageId(null);
      try {
        let conversation: ApiChatConversation | null = null;

        if (initialConversationId != null && initialConversationId > 0) {
          conversation = await fetchConversation(initialConversationId);
        } else if (inquiryId != null && inquiryId > 0) {
          try {
            conversation = await openInquiryChat(inquiryId);
          } catch {
            conversation = await ensureInquiryConversation(inquiryId);
          }
        } else if (rfqId != null && rfqId > 0) {
          if (role === "buyer" && !sellerId) {
            setMissingSellerId(true);
            setBootError(humanizeChatBootError("", true));
            setConversationId(null);
            return;
          }
          conversation = await ensureRfqConversation({
            rfqId,
            role,
            sellerId: sellerId ?? undefined,
          });
        } else {
          setBootError("Missing conversation, inquiry, or RFQ to open chat.");
          setConversationId(null);
          return;
        }

        if (cancelled) return;
        await openConversation(conversation);
      } catch (err) {
        if (!cancelled) {
          console.error("[chat] open conversation failed:", err);
          const msg = getChatErrorMessage(err, "Unable to open chat");
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
    };
    // Intentionally depend only on conversation identity / open targets.
    // Do NOT re-boot when parent re-renders after send (conversation:updated
    // refreshing selected meta / otherPartyName), or the thread flash-reloads.
  }, [
    initialConversationId,
    inquiryId,
    rfqId,
    role,
    sellerId,
    loadMessages,
    setActiveConversationId,
    upsertConversationMeta,
  ]);

  // Keep header label fresh without reopening the conversation.
  useEffect(() => {
    if (otherPartyName?.trim()) setHeaderName(otherPartyName.trim());
  }, [otherPartyName]);

  // Clear active conversation only when the chat panel fully unmounts.
  useEffect(() => {
    return () => {
      setActiveConversationId(null);
    };
  }, [setActiveConversationId]);

  useEffect(() => {
    if (!conversationId) return;
    joinConversation(conversationId);
  }, [conversationId]);

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

    let latestIncomingId = 0;
    for (const msg of messages) {
      if (msg.is_mine || msg.id <= 0) continue;
      if (msg.id > latestIncomingId) latestIncomingId = msg.id;
    }
    if (latestIncomingId <= 0) return;
    if (
      lastMarkedReadIdRef.current != null &&
      latestIncomingId <= lastMarkedReadIdRef.current
    ) {
      if (unreadBannerCount > 0) setUnreadBannerCount(0);
      return;
    }

    lastMarkedReadIdRef.current = latestIncomingId;
    void markRead(conversationId, latestIncomingId, 0);
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
  }, [messages.length, scheduleMarkVisibleRead]);

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
    ? `flex h-full min-h-0 flex-col overflow-hidden bg-card ${className}`
    : `flex h-[min(560px,70vh)] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm ${className}`;

  const chatUnavailable = Boolean(bootError);
  const canCompose =
    Boolean(conversationId) && !bootLoading && !chatUnavailable;
  const composerDisabled = !canCompose;
  const errorCopy = humanizeChatBootError(bootError ?? "", missingSellerId);
  const headerLogoUrl = resolveImageUrl(headerLogo);

  return (
    <section className={shellClass}>
      {hideHeader ? (
        disconnected && !chatUnavailable ? (
          <div className="border-b border-border px-4 py-2">
            <span className="inline-flex items-center rounded-full border border-warning/25 bg-warning-soft px-2 py-0.5 text-[10px] font-semibold text-warning">
              Reconnecting...
            </span>
          </div>
        ) : null
      ) : (
        <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3.5">
          <div className="flex min-w-0 items-start gap-3">
            <div className="relative shrink-0">
              <span className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-primary-soft text-base font-bold text-primary">
                {headerLogoUrl ? (
                  <Image
                    src={headerLogoUrl}
                    alt=""
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                ) : (
                  getInitials(headerName)
                )}
              </span>
            </div>
            <div className="min-w-0 pt-0.5">
              <h3 className="truncate text-sm font-bold text-foreground">{headerName}</h3>
              {disconnected && !chatUnavailable ? (
                <div className="mt-0.5">
                  <span className="inline-flex items-center rounded-full border border-warning/25 bg-warning-soft px-2 py-0.5 text-[10px] font-semibold text-warning">
                    Reconnecting...
                  </span>
                </div>
              ) : null}
            </div>
          </div>
          {rfqStatus ? (
            <RfqStatusBadge status={rfqStatus} className="shrink-0 px-3 py-1.5 text-[11px]" />
          ) : null}
        </header>
      )}

      <div
        ref={listRef}
        onScroll={conversationId && !bootLoading && !chatUnavailable ? handleScroll : undefined}
        className={`min-h-0 flex-1 bg-muted ${
          chatUnavailable || bootLoading || messages.length === 0
            ? "flex flex-col"
            : "overflow-y-auto px-4 py-4"
        }`}
      >
        {bootLoading ? (
          <div className="relative flex h-full flex-1 flex-col justify-end gap-3 px-4 pb-6">
            <div className="mr-auto h-10 w-2/3 animate-pulse rounded-2xl bg-border" />
            <div className="ml-auto h-10 w-1/2 animate-pulse rounded-2xl bg-primary-soft" />
            <div className="mr-auto h-14 w-3/5 animate-pulse rounded-2xl bg-border" />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-muted/70 text-sm text-muted-fg">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Opening chat...
            </div>
          </div>
        ) : chatUnavailable ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
            <div className="relative">
              <MessageSquare className="h-10 w-10 text-warning/80" strokeWidth={1.5} />
              <AlertCircle className="absolute -right-1.5 -top-1.5 h-5 w-5 fill-warning-soft text-warning" />
            </div>
            <p className="mt-4 text-sm font-bold text-foreground">Chat unavailable</p>
            <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted-fg">{errorCopy}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-card ring-1 ring-border">
              <MessageSquare className="h-7 w-7 text-muted-fg" strokeWidth={1.5} />
            </div>
            <p className="mt-3 text-sm font-bold text-foreground">No messages yet</p>
            <p className="mt-1 text-xs text-muted-fg">
              {role === "buyer" ? "Say hello to start the conversation." : "Start the conversation."}
            </p>
          </div>
        ) : (
          <>
            {loadingMessages ? (
              <div className="flex justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
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
                    <span className="h-px flex-1 bg-border" />
                    <span className="shrink-0 rounded-full bg-success px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                      {unreadBannerCount > 99 ? "99+" : unreadBannerCount} unread message
                      {unreadBannerCount === 1 ? "" : "s"}
                    </span>
                    <span className="h-px flex-1 bg-border" />
                  </div>
                ) : null}
                <div data-chat-message-id={message.id > 0 ? message.id : undefined}>
                  <ChatMessageBubble
                    message={message}
                    showAvatar={messageLayout[index]?.showAvatar}
                    showTimestamp={messageLayout[index]?.showTimestamp}
                    avatarName={headerName}
                    role={role}
                    className={messageLayout[index]?.gapClass}
                  />
                </div>
              </React.Fragment>
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {canCompose ? (
        <div className="relative border-t border-border bg-card px-3 py-3">
          <div ref={attachRef} className="flex items-end gap-2">
            {attachOpen ? (
              <div className="absolute bottom-[calc(100%-4px)] left-0 z-20 w-[240px] overflow-hidden rounded-xl border border-border bg-card py-1 shadow-[var(--shadow-elevated)]">
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-medium text-foreground transition hover:bg-muted"
                >
                  <ImageIcon className="h-5 w-5 shrink-0 text-muted-fg" />
                  Photo
                </button>
                <button
                  type="button"
                  onClick={() => docInputRef.current?.click()}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-medium text-foreground transition hover:bg-muted"
                >
                  <FileText className="h-5 w-5 shrink-0 text-muted-fg" />
                  Document
                </button>
                {role === "buyer" && productId ? (
                  <button
                    type="button"
                    onClick={() => void handleAttachProduct()}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-medium text-foreground transition hover:bg-muted"
                  >
                    <Package className="h-5 w-5 shrink-0 text-muted-fg" />
                    Attach Product
                  </button>
                ) : null}
                {role === "seller" && quotations.length === 1 ? (
                  <button
                    type="button"
                    onClick={() => void handleAttachQuotation(quotations[0].id)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-medium text-foreground transition hover:bg-muted"
                  >
                    <MessageSquare className="h-5 w-5 shrink-0 text-muted-fg" />
                    Attach Quote #{quotations[0].id}
                  </button>
                ) : null}
                {role === "seller" && quotations.length > 1 ? (
                  <div>
                    <button
                      type="button"
                      onClick={() => setQuotePickerOpen((v) => !v)}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-medium text-foreground transition hover:bg-muted"
                    >
                      <MessageSquare className="h-5 w-5 shrink-0 text-muted-fg" />
                      <span className="flex-1">Attach Quotation</span>
                      <ChevronRight
                        className={`h-4 w-4 text-muted-fg transition ${quotePickerOpen ? "rotate-90" : ""}`}
                      />
                    </button>
                    {quotePickerOpen ? (
                      <div className="border-t border-border bg-muted py-1">
                        {quotations.map((q) => (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() => void handleAttachQuotation(q.id)}
                            className="flex w-full px-3 py-2 pl-11 text-left text-xs font-semibold text-muted-fg transition hover:bg-card hover:text-foreground"
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
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 ${
                attachOpen
                  ? "border-primary/40 bg-primary-soft text-primary"
                  : "border-border text-muted-fg hover:bg-muted"
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
                setDraft(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              rows={1}
              placeholder={disconnected ? "Reconnecting..." : "Type a message..."}
              className="max-h-28 min-h-[44px] flex-1 resize-none rounded-lg border border-border bg-muted px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors duration-200 focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:opacity-50"
            />
            <button
              type="button"
              disabled={!draft.trim() || sending || composerDisabled}
              onClick={() => void handleSend()}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 ${
                draft.trim() && !sending && !composerDisabled
                  ? "bg-primary text-white hover:bg-primary-hover"
                  : "cursor-not-allowed bg-border text-muted-fg"
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
