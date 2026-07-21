"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  MessageCircle,
  MessagesSquare,
  Search,
  X,
} from "lucide-react";
import ChatPanel from "@/components/chat/ChatPanel";
import ConversationBadge, {
  formatChatBadgeCount,
} from "@/components/chat/ConversationBadge";
import PortalPagination from "@/components/portal/PortalPagination";
import { useChat } from "@/context/ChatContext";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { fetchConversations } from "@/services/chatService";
import { conversationCounterpartyLogo, effectiveConversationUnread, mergeConversationMeta, sortConversationsByLastMessage } from "@/utils/chatHelpers";
import { getInitials, resolveImageUrl } from "@/utils/catalogHelpers";
import type { ApiChatConversation, ChatRole } from "@/types/chat";

function previewText(conversation: ApiChatConversation): string {
  const last = conversation.last_message;
  if (typeof last === "string" && last.trim()) return last.trim();
  if (last && typeof last === "object") {
    const content = last.content?.trim();
    if (content) return content;
    if (last.message_type === "PRODUCT") return "Shared a product";
    if (last.message_type === "QUOTATION") return "Shared a quotation";
    if (last.message_type === "IMAGE") return "Photo";
    if (last.message_type === "DOCUMENT") return "Document";
    if (last.message_type === "SYSTEM") return "Update";
  }
  return "No messages yet";
}

function formatWhen(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) {
    return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()
  ) {
    return "Yesterday";
  }
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function counterpartyName(conversation: ApiChatConversation, role: ChatRole): string {
  const other =
    conversation.other_party ??
    (role === "buyer" ? conversation.seller : conversation.buyer);
  return (
    other?.company_name?.trim() ||
    other?.name?.trim() ||
    (role === "buyer" ? "Seller" : "Buyer")
  );
}

function PartyAvatar({
  conversation,
  role,
  name,
  size = "md",
  tone = "buyer",
}: {
  conversation: ApiChatConversation;
  role: ChatRole;
  name: string;
  size?: "md" | "lg";
  tone?: "buyer" | "seller";
}) {
  const logoUrl = resolveImageUrl(conversationCounterpartyLogo(conversation, role));
  const dim = size === "lg" ? "h-10 w-10 text-sm" : "h-11 w-11 text-sm";
  const toneClass =
    tone === "seller"
      ? "bg-portal-seller-light text-portal-seller"
      : "bg-primary-soft text-primary";

  return (
    <span
      className={`relative flex ${dim} shrink-0 items-center justify-center overflow-hidden rounded-full font-bold ${toneClass}`}
    >
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt=""
          width={size === "lg" ? 40 : 44}
          height={size === "lg" ? 40 : 44}
          className="h-full w-full object-cover"
          unoptimized
        />
      ) : (
        getInitials(name)
      )}
    </span>
  );
}

const PAGE_SIZE = 30;
const ROW_INDICATOR_LAYOUT_ID = "chats-inbox-row-indicator";

interface ChatsInboxProps {
  role: ChatRole;
}

export default function ChatsInbox({ role }: ChatsInboxProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { syncConversationsUnread, upsertConversationMeta, conversationsMeta, unreadSummary } =
    useChat();
  const chatRole = role;
  const isSeller = chatRole === "seller";

  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search);
  const [selected, setSelected] = useState<ApiChatConversation | null>(null);
  const deepLinkConversationId = Number(searchParams.get("conversation") || "");

  useEffect(() => {
    void syncConversationsUnread();
  }, [syncConversationsUnread]);

  const fetchPage = useCallback(
    (page: number) =>
      fetchConversations({
        page,
        limit: PAGE_SIZE,
        role: chatRole,
        search: debouncedSearch.trim() || undefined,
        sort_by: "last_message_at",
        sort_order: "desc",
      }),
    [chatRole, debouncedSearch]
  );

  const { items, pagination, loading, error, goToPage, reload } = usePaginatedList({
    fetchPage,
    resetDeps: [chatRole, debouncedSearch],
  });

  useEffect(() => {
    for (const conversation of items) {
      upsertConversationMeta(conversation);
    }
  }, [items, upsertConversationMeta]);

  // FCM OPEN_CHAT → /{role}/chats?conversation={id}
  useEffect(() => {
    if (!Number.isFinite(deepLinkConversationId) || deepLinkConversationId <= 0) return;
    if (selected?.id === deepLinkConversationId) return;
    const match = items.find((c) => c.id === deepLinkConversationId);
    if (!match) return;
    upsertConversationMeta(match);
    setSelected(match);
  }, [deepLinkConversationId, items, selected?.id, upsertConversationMeta]);

  const rows = useMemo(() => {
    // Guide: REST rich rows + socket unread_summary fields, sorted last_message_at DESC.
    const merged = items.map((item) => {
      const live = conversationsMeta[item.id];
      return live ? mergeConversationMeta(item, live) : item;
    });
    return sortConversationsByLastMessage(merged);
  }, [items, conversationsMeta]);

  const totalUnread = useMemo(() => {
    const roleScoped = isSeller ? unreadSummary.as_seller : unreadSummary.as_buyer;
    if (typeof roleScoped === "number") return Math.max(0, roleScoped);
    if (typeof unreadSummary.total_unread === "number") {
      return Math.max(0, unreadSummary.total_unread);
    }
    return rows.reduce((sum, c) => sum + effectiveConversationUnread(c), 0);
  }, [
    isSeller,
    unreadSummary.as_buyer,
    unreadSummary.as_seller,
    unreadSummary.total_unread,
    rows,
  ]);

  useEffect(() => {
    if (!selected?.id) return;
    const live = conversationsMeta[selected.id];
    if (!live) return;
    setSelected((prev) => {
      if (!prev || prev.id !== live.id) return prev;
      // Soft-merge preview fields only — avoid churning open-chat props
      // (rfq_id / inquiry_id / parties) that would re-boot ChatPanel.
      const nextPreview =
        live.last_message !== prev.last_message ||
        live.last_message_at !== prev.last_message_at ||
        live.unread_count !== prev.unread_count;
      if (!nextPreview) return prev;
      return {
        ...prev,
        last_message: live.last_message ?? prev.last_message,
        last_message_at: live.last_message_at ?? prev.last_message_at,
        unread_count: live.unread_count ?? prev.unread_count,
      };
    });
  }, [conversationsMeta, selected?.id]);

  function selectConversation(conversation: ApiChatConversation) {
    upsertConversationMeta(conversation);
    setSelected(conversation);
    const base = isSeller ? "/seller/chats" : "/buyer/chats";
    router.replace(`${base}?conversation=${conversation.id}`, { scroll: false });
  }

  function closeThread() {
    setSelected(null);
    router.replace(isSeller ? "/seller/chats" : "/buyer/chats", { scroll: false });
    void syncConversationsUnread();
    void reload();
  }

  const showThreadMobile = Boolean(selected);

  return (
    <div className="flex h-[calc(100dvh-3.5rem-4.5rem-env(safe-area-inset-bottom))] flex-col overflow-hidden bg-portal-bg lg:-mb-6 lg:h-[calc(100dvh-3.5rem-1.5rem)]">
      <div className="flex h-full w-full flex-1 overflow-hidden border-border bg-card shadow-[var(--shadow-soft)] sm:border-y lg:border">
        {/* Conversation list */}
        <aside
          className={`flex h-full w-full shrink-0 flex-col border-r border-border bg-card md:w-[360px] lg:w-[400px] ${
            showThreadMobile ? "hidden md:flex" : "flex"
          }`}
        >
          <header className="shrink-0 border-b border-border px-4 pb-3 pt-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-[17px] font-semibold tracking-tight text-foreground">
                    Chats
                  </h1>
                  {totalUnread > 0 ? (
                    <span className="inline-flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-md bg-primary px-1.5 text-[11px] font-bold leading-none text-white">
                      {formatChatBadgeCount(totalUnread)}
                    </span>
                  ) : null}
                </div>
                <p className="truncate text-xs text-muted-fg">
                  {isSeller ? "Buyers & leads" : "Sellers & suppliers"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearchOpen((open) => {
                    if (open) setSearch("");
                    return !open;
                  });
                }}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                  searchOpen
                    ? "border-primary/30 bg-primary-soft text-primary"
                    : "border-border text-muted-fg hover:border-primary/30 hover:bg-primary-soft hover:text-primary"
                }`}
                aria-label={searchOpen ? "Close search" : "Search chats"}
              >
                {searchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
              </button>
            </div>
          </header>

          <AnimatePresence initial={false}>
            {searchOpen ? (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="shrink-0 overflow-hidden border-b border-border bg-card"
              >
                <div className="px-4 py-3">
                  <div
                    className={`group flex h-10 items-center gap-2 rounded-lg border bg-muted px-3 transition-colors ${
                      search
                        ? "border-primary/30 ring-2 ring-primary/10"
                        : "border-border focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/10"
                    }`}
                  >
                    <Search
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        search
                          ? "text-primary"
                          : "text-muted-placeholder group-focus-within:text-primary"
                      }`}
                      aria-hidden
                    />
                    <input
                      autoFocus
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by name or company…"
                      className="h-full w-full min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-placeholder"
                    />
                    <AnimatePresence initial={false}>
                      {search ? (
                        <motion.button
                          key="clear"
                          type="button"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.12 }}
                          onClick={() => setSearch("")}
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-fg transition-colors hover:bg-primary-soft hover:text-primary"
                          aria-label="Clear search"
                        >
                          <X className="h-3.5 w-3.5" />
                        </motion.button>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading && rows.length === 0 ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="px-6 py-12 text-center">
                <p className="text-sm font-semibold text-foreground">Could not load chats</p>
                <p className="mt-1 text-xs text-muted-fg">{error}</p>
              </div>
            ) : rows.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <MessagesSquare className="h-6 w-6" strokeWidth={1.5} />
                </div>
                <p className="mt-3 text-sm font-semibold text-foreground">
                  {debouncedSearch.trim() ? "No chats found" : "No chats yet"}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-fg">
                  {debouncedSearch.trim()
                    ? `No results for "${debouncedSearch.trim()}".`
                    : chatRole === "buyer"
                      ? "Send a product inquiry or chat from an RFQ to start a thread."
                      : "Buyer messages on RFQs and inquiries will show up here."}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {rows.map((conversation) => {
                  const name = counterpartyName(conversation, chatRole);
                  const unread = effectiveConversationUnread(conversation);
                  const when = formatWhen(
                    conversation.last_message_at ?? conversation.updated_at
                  );
                  const preview = previewText(conversation);
                  const active = selected?.id === conversation.id;

                  return (
                    <li key={conversation.id}>
                      <motion.button
                        type="button"
                        onClick={() => selectConversation(conversation)}
                        whileTap={{ scale: 0.985 }}
                        transition={{ duration: 0.12 }}
                        className={`relative flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                          active ? "bg-primary-soft/60" : "hover:bg-muted/70"
                        }`}
                      >
                        {active ? (
                          <motion.span
                            layoutId={ROW_INDICATOR_LAYOUT_ID}
                            className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-primary"
                            transition={{ type: "spring", stiffness: 500, damping: 40 }}
                          />
                        ) : null}
                        <PartyAvatar
                          conversation={conversation}
                          role={chatRole}
                          name={name}
                          tone={isSeller ? "seller" : "buyer"}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline justify-between gap-2">
                            <span
                              className={`truncate text-sm ${
                                unread > 0
                                  ? "font-semibold text-foreground"
                                  : "font-medium text-foreground"
                              }`}
                            >
                              {name}
                            </span>
                            {when ? (
                              <span
                                className={`shrink-0 text-[11px] ${
                                  unread > 0 ? "font-semibold text-primary" : "text-muted-fg"
                                }`}
                              >
                                {when}
                              </span>
                            ) : null}
                          </span>
                          <span className="mt-0.5 flex items-center gap-2">
                            <span
                              className={`min-w-0 flex-1 truncate text-xs ${
                                unread > 0 ? "text-foreground" : "text-muted-fg"
                              }`}
                            >
                              {preview}
                            </span>
                            {unread > 0 ? (
                              <ConversationBadge count={unread} size="md" className="shrink-0" />
                            ) : null}
                          </span>
                        </span>
                      </motion.button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {pagination.totalPages > 1 ? (
            <div className="shrink-0 border-t border-border bg-card px-2 py-2">
              <PortalPagination pagination={pagination} onPageChange={goToPage} compact />
            </div>
          ) : null}
        </aside>

        {/* Thread pane */}
        <section
          className={`relative h-full min-w-0 flex-1 flex-col bg-portal-bg ${
            showThreadMobile ? "flex" : "hidden md:flex"
          }`}
        >
          {selected ? (
            <div className="flex h-full min-h-0 flex-col">
              <header className="flex shrink-0 items-center gap-3 border-b border-border bg-card px-3 py-3 sm:px-4">
                <button
                  type="button"
                  onClick={closeThread}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-fg transition-colors hover:bg-muted hover:text-primary md:hidden"
                  aria-label="Back to chats"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <PartyAvatar
                  conversation={selected}
                  role={chatRole}
                  name={counterpartyName(selected, chatRole)}
                  size="lg"
                  tone={isSeller ? "seller" : "buyer"}
                />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-sm font-semibold tracking-tight text-foreground">
                    {counterpartyName(selected, chatRole)}
                  </h2>
                </div>
              </header>
              <div className="min-h-0 flex-1">
                <ChatPanel
                  key={selected.id}
                  embedded
                  hideHeader
                  className="!h-full"
                  role={chatRole}
                  conversationId={selected.id}
                  otherPartyName={counterpartyName(selected, chatRole)}
                  rfqId={selected.rfq_id ?? null}
                  inquiryId={selected.inquiry_id ?? null}
                />
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="relative flex h-full flex-col items-center justify-center overflow-hidden bg-card px-8 text-center"
            >
              <div aria-hidden className="pointer-events-none absolute inset-0">
                <div className="absolute -left-20 -top-24 h-72 w-72 rounded-full bg-primary-soft/60 blur-3xl" />
                <div className="absolute -right-16 bottom-[-6rem] h-80 w-80 rounded-full bg-navy/5 blur-3xl" />
              </div>
              <div className="relative flex flex-col items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                  <MessageCircle className="h-8 w-8" strokeWidth={1.5} />
                </div>
                <h2 className="mt-5 text-xl font-semibold tracking-tight text-foreground">
                  Your conversations
                </h2>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-fg">
                  Select a chat to continue messaging. Product inquiries and RFQ discussions
                  share one thread per buyer–seller pair.
                </p>
              </div>
            </motion.div>
          )}
        </section>
      </div>
    </div>
  );
}
