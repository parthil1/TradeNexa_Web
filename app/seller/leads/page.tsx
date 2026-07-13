"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Inbox, Loader2, MessageSquare } from "lucide-react";
import ConversationBadge, {
  formatChatBadgeCount,
  useChatUnreadBadge,
} from "@/components/chat/ConversationBadge";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import PortalEmptyState from "@/components/portal/PortalEmptyState";
import PortalPagination from "@/components/portal/PortalPagination";
import RfqListCard from "@/components/rfq/RfqListCard";
import RfqListSidebar from "@/components/rfq/RfqListSidebar";
import RfqListToolbar from "@/components/rfq/RfqListToolbar";
import { useChat } from "@/context/ChatContext";
import { fetchSellerRfqFeed } from "@/services/rfqService";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  formatRfqStatusTabLabel,
  isRfqPostedToday,
  rfqTabToApiStatus,
  SELLER_RFQ_STATUS_TABS,
} from "@/utils/rfqHelpers";

const tabs = SELLER_RFQ_STATUS_TABS;

const PAGE_SIZE = 6;

export default function SellerLeadsPage() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const unreadTotal = useChatUnreadBadge();
  const { syncConversationsUnread } = useChat();

  useEffect(() => {
    void syncConversationsUnread();
  }, [syncConversationsUnread]);

  const fetchPage = useCallback(
    (page: number) =>
      fetchSellerRfqFeed({
        page,
        limit: PAGE_SIZE,
        sort_by: "created_at",
        sort_order: "desc",
        status: rfqTabToApiStatus(activeTab),
        search: debouncedSearch || undefined,
      }),
    [activeTab, debouncedSearch]
  );

  const { items, pagination, loading, error, goToPage } = usePaginatedList({
    fetchPage,
    resetDeps: [activeTab, debouncedSearch],
  });

  const newTodayCount = useMemo(
    () => items.filter((rfq) => isRfqPostedToday(rfq.created_at)).length,
    [items]
  );

  const hasSearch = debouncedSearch.trim().length > 0;
  const tabLabel = formatRfqStatusTabLabel(activeTab).toLowerCase();
  const emptyTitle = hasSearch
    ? "No RFQs match your search"
    : activeTab === "all"
      ? "No RFQs in your feed"
      : `No ${tabLabel} RFQs`;
  const emptyDescription = hasSearch
    ? `No results for "${debouncedSearch.trim()}". Try a different keyword or clear the search.`
    : activeTab === "all"
      ? "New buyer requirements matching your categories will appear here."
      : `No buyer requirements are currently ${tabLabel}.`;

  const showCatalogPrompt = !loading && pagination.total > 0 && pagination.total <= PAGE_SIZE;
  const unreadLabel =
    unreadTotal > 0
      ? `${formatChatBadgeCount(unreadTotal)} unread message${unreadTotal === 1 ? "" : "s"}`
      : null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
      <PortalPageHeader
        title="RFQ Feed"
        subtitle="Buyer requirements you can quote on"
        action={
          newTodayCount > 0 ? (
            <span className="inline-flex items-center rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
              {newTodayCount} new today
            </span>
          ) : null
        }
      />

      <RfqListToolbar
        loading={loading}
        countLabel={`${pagination.total} RFQ${pagination.total === 1 ? "" : "s"} in feed`}
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Search RFQs by title, buyer, or category...",
        }}
        filters={
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 cursor-pointer rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
                  activeTab === tab
                    ? "bg-primary text-white shadow-sm"
                    : "bg-white text-muted-fg ring-1 ring-border hover:ring-primary/30"
                }`}
              >
                {formatRfqStatusTabLabel(tab)}
              </button>
            ))}
          </div>
        }
      />

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-6">
        <div>
          {error ? (
            <p className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">{error}</p>
          ) : null}

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-fg">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Loading RFQs...
            </div>
          ) : items.length === 0 ? (
            <PortalEmptyState
              icon={Inbox}
              title={emptyTitle}
              description={emptyDescription}
              action={
                hasSearch ? (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="cursor-pointer rounded-xl border border-border px-4 py-2 text-sm font-bold text-muted-fg"
                  >
                    Clear search
                  </button>
                ) : undefined
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {items.map((rfq) => (
                  <RfqListCard
                    key={rfq.id}
                    rfq={rfq}
                    href={`/seller/lead/${rfq.id}`}
                    variant="seller"
                    meta={rfq.buyer_company ?? undefined}
                  />
                ))}
              </div>
              <PortalPagination
                pagination={pagination}
                onPageChange={goToPage}
                loading={loading}
                itemLabel="RFQs"
                compact
              />
            </>
          )}

          {showCatalogPrompt ? (
            <div className="mt-6 rounded-2xl border border-dashed border-border bg-muted p-5 text-center">
              <p className="text-sm font-bold text-foreground">Want more leads?</p>
              <p className="mt-1 text-xs text-muted-fg">
                Keep your catalog up to date so buyers can find you for matching requirements.
              </p>
              <Link
                href="/seller/catalog"
                className="mt-3 inline-flex cursor-pointer items-center gap-1 rounded-xl border border-border bg-white px-4 py-2 text-xs font-bold text-muted-fg transition hover:border-primary/40 hover:text-primary"
              >
                Manage catalog
              </Link>
            </div>
          ) : null}
        </div>

        <RfqListSidebar
          stats={[
            { label: "Total in feed", value: loading ? "—" : pagination.total },
            {
              label: "New today",
              value: loading ? "—" : newTodayCount,
              highlight: newTodayCount > 0,
            },
          ]}
          action={
            <Link
              href="/seller/quotations"
              aria-label={
                unreadLabel ? `My Quotations, ${unreadLabel}` : "My Quotations"
              }
              className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-border bg-white p-4 text-sm font-bold text-muted-fg transition hover:border-primary/40 hover:text-primary"
            >
              <span className="min-w-0">
                <span className="block">My Quotations</span>
                {unreadTotal > 0 ? (
                  <span className="mt-0.5 block text-[11px] font-semibold text-whatsapp-dark">
                    {formatChatBadgeCount(unreadTotal)} unread message
                    {unreadTotal === 1 ? "" : "s"}
                  </span>
                ) : null}
              </span>
              <span className="relative shrink-0">
                <MessageSquare className="h-4 w-4" />
                {unreadTotal > 0 ? (
                  <ConversationBadge
                    count={unreadTotal}
                    size="md"
                    className="absolute -right-2.5 -top-2.5"
                  />
                ) : null}
              </span>
            </Link>
          }
        />
      </div>
    </div>
  );
}
