"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { effectiveConversationUnread } from "@/utils/chatHelpers";
import { getInitials } from "@/utils/catalogHelpers";
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

function contextLabel(conversation: ApiChatConversation): string | null {
  const title = conversation.last_context?.title?.trim();
  const type = (conversation.last_context?.type ?? "").toLowerCase();
  if (title) {
    if (type === "rfq") return `RFQ · ${title}`;
    if (type === "product" || type === "enquiry" || type === "inquiry") {
      return `Product · ${title}`;
    }
    return title;
  }
  if (conversation.rfq_title?.trim()) return `RFQ · ${conversation.rfq_title.trim()}`;
  if (conversation.rfq_id) return `RFQ #${conversation.rfq_id}`;
  if (conversation.inquiry_id) return `Inquiry #${conversation.inquiry_id}`;
  return null;
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

const PAGE_SIZE = 30;

interface ChatsInboxProps {
  role: ChatRole;
}

export default function ChatsInbox({ role }: ChatsInboxProps) {
  const { syncConversationsUnread, upsertConversationMeta, conversationsMeta } = useChat();
  const chatRole = role;

  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search);
  const [selected, setSelected] = useState<ApiChatConversation | null>(null);

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

  const rows = useMemo(() => {
    return items.map((item) => {
      const live = conversationsMeta[item.id];
      return live ? { ...item, ...live, id: item.id } : item;
    });
  }, [items, conversationsMeta]);

  useEffect(() => {
    if (!selected?.id) return;
    const live = conversationsMeta[selected.id];
    if (!live) return;
    setSelected((prev) => {
      if (!prev || prev.id !== live.id) return prev;
      return { ...prev, ...live, id: prev.id };
    });
  }, [conversationsMeta, selected?.id]);

  function selectConversation(conversation: ApiChatConversation) {
    upsertConversationMeta(conversation);
    setSelected(conversation);
  }

  function closeThread() {
    setSelected(null);
    void syncConversationsUnread();
    void reload();
  }

  const showThreadMobile = Boolean(selected);

  return (
    <div className="flex h-[calc(100dvh-3.5rem-4.5rem-env(safe-area-inset-bottom))] flex-col overflow-hidden bg-portal-bg lg:-mb-6 lg:h-[calc(100dvh-3.5rem-1.5rem)]">
      <div className="mx-auto flex h-full w-full max-w-7xl flex-1 overflow-hidden border-border bg-card shadow-[var(--shadow-card)] sm:rounded-xl sm:border lg:mx-4 lg:my-0 xl:mx-auto">
        {/* Conversation list */}
        <aside
          className={`flex h-full w-full flex-col border-r border-border bg-card md:max-w-[360px] lg:max-w-[400px] ${
            showThreadMobile ? "hidden md:flex" : "flex"
          }`}
        >
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3.5">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-placeholder">
                Messaging
              </p>
              <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
                Chats
              </h1>
              <p className="truncate text-xs text-muted-fg">
                {chatRole === "buyer" ? "Sellers & suppliers" : "Buyers & leads"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-fg transition-colors hover:border-primary/30 hover:bg-primary-soft hover:text-primary"
              aria-label={searchOpen ? "Close search" : "Search chats"}
            >
              {searchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
            </button>
          </header>

          <AnimatePresence initial={false}>
            {searchOpen ? (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="shrink-0 overflow-hidden border-b border-border bg-muted px-3 py-2.5"
              >
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-fg" />
                  <input
                    autoFocus
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or company…"
                    className="input-base !pl-10"
                  />
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
                  const context = contextLabel(conversation);
                  const preview = previewText(conversation);
                  const active = selected?.id === conversation.id;

                  return (
                    <li key={conversation.id}>
                      <button
                        type="button"
                        onClick={() => selectConversation(conversation)}
                        className={`flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors ${
                          active
                            ? "bg-primary-soft/70"
                            : "hover:bg-muted"
                        }`}
                      >
                        <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">
                          {getInitials(name)}
                          {unread > 0 ? (
                            <ConversationBadge
                              count={unread}
                              className="absolute -right-0.5 -top-0.5"
                            />
                          ) : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline justify-between gap-2">
                            <span
                              className={`truncate text-sm ${
                                unread > 0
                                  ? "font-bold text-foreground"
                                  : "font-semibold text-foreground"
                              }`}
                            >
                              {name}
                            </span>
                            {when ? (
                              <span
                                className={`shrink-0 text-[11px] ${
                                  unread > 0
                                    ? "font-semibold text-primary"
                                    : "text-muted-fg"
                                }`}
                              >
                                {when}
                              </span>
                            ) : null}
                          </span>
                          {context ? (
                            <span className="mt-0.5 block truncate text-[11px] font-medium text-primary">
                              {context}
                            </span>
                          ) : null}
                          <span className="mt-0.5 flex items-center gap-2">
                            <span
                              className={`min-w-0 flex-1 truncate text-xs ${
                                unread > 0
                                  ? "font-semibold text-foreground"
                                  : "text-muted-fg"
                              }`}
                            >
                              {preview}
                            </span>
                            {unread > 0 ? (
                              <span className="shrink-0 rounded-full bg-primary-soft px-1.5 py-0.5 text-[10px] font-bold text-primary">
                                {formatChatBadgeCount(unread)}
                              </span>
                            ) : null}
                          </span>
                        </span>
                      </button>
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
          className={`relative h-full min-w-0 flex-1 flex-col bg-muted ${
            showThreadMobile ? "flex" : "hidden md:flex"
          }`}
        >
          {selected ? (
            <div className="flex h-full min-h-0 flex-col">
              <div className="flex shrink-0 items-center gap-2 border-b border-border bg-card px-2 py-2 md:hidden">
                <button
                  type="button"
                  onClick={closeThread}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-fg transition hover:border-primary/30 hover:bg-primary-soft hover:text-primary"
                  aria-label="Back to chats"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <span className="truncate text-sm font-semibold text-foreground">
                  {counterpartyName(selected, chatRole)}
                </span>
              </div>
              <div className="min-h-0 flex-1">
                <ChatPanel
                  key={selected.id}
                  embedded
                  className="!h-full"
                  role={chatRole}
                  conversationId={selected.id}
                  contextTitle={
                    selected.last_context?.title || selected.rfq_title || null
                  }
                  otherPartyName={counterpartyName(selected, chatRole)}
                  rfqId={selected.rfq_id ?? null}
                  inquiryId={selected.inquiry_id ?? null}
                />
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex h-full flex-col items-center justify-center bg-card px-8 text-center"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                <MessageCircle className="h-8 w-8" strokeWidth={1.5} />
              </div>
              <h2 className="mt-5 text-xl font-semibold tracking-tight text-foreground">
                Your conversations
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-fg">
                Select a chat to continue messaging. Product inquiries and RFQ discussions share
                one thread per buyer–seller pair.
              </p>
            </motion.div>
          )}
        </section>
      </div>
    </div>
  );
}
