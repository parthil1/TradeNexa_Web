"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FileText, Loader2, Plus } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import PortalEmptyState from "@/components/portal/PortalEmptyState";
import PortalPagination from "@/components/portal/PortalPagination";
import RfqListCard from "@/components/rfq/RfqListCard";
import RfqListSidebar from "@/components/rfq/RfqListSidebar";
import RfqListToolbar from "@/components/rfq/RfqListToolbar";
import { Button } from "@/components/common/Button";
import { useChat } from "@/context/ChatContext";
import { fetchMyRfqs } from "@/services/rfqService";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  BUYER_RFQ_STATUS_TABS,
  formatRfqStatusTabLabel,
  isRfqPostedToday,
  rfqTabToApiStatus,
} from "@/utils/rfqHelpers";

const tabs = BUYER_RFQ_STATUS_TABS;

const PAGE_SIZE = 6;

export default function BuyerInquiriesPage() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const { syncConversationsUnread } = useChat();

  useEffect(() => {
    void syncConversationsUnread();
  }, [syncConversationsUnread]);

  const fetchPage = useCallback(
    (page: number) =>
      fetchMyRfqs({
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

  const quotesOnPage = useMemo(
    () => items.reduce((sum, rfq) => sum + (rfq.quotations_count ?? 0), 0),
    [items]
  );

  const hasSearch = debouncedSearch.trim().length > 0;
  const tabLabel = formatRfqStatusTabLabel(activeTab).toLowerCase();
  const emptyTitle = hasSearch
    ? "No RFQs match your search"
    : activeTab === "all"
      ? "No RFQs yet"
      : `No ${tabLabel} RFQs`;
  const emptyDescription = hasSearch
    ? `No results for "${debouncedSearch.trim()}". Try a different keyword or clear the search.`
    : activeTab === "all"
      ? "Post a requirement to receive quotes from verified sellers."
      : `You don't have any RFQs in the ${tabLabel} state.`;

  const showPostPrompt = !loading && pagination.total > 0 && pagination.total <= PAGE_SIZE;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
      <PortalPageHeader
        title="My RFQs"
        subtitle="Track your requirements and seller quotes"
        action={
          <div className="flex items-center gap-2">
            {newTodayCount > 0 ? (
              <span className="inline-flex items-center rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
                {newTodayCount} new today
              </span>
            ) : null}
            <Link href="/buyer/post-requirement">
              <Button>
                <Plus className="h-4 w-4" aria-hidden />
                New RFQ
              </Button>
            </Link>
          </div>
        }
      />

      <RfqListToolbar
        loading={loading}
        countLabel={`${pagination.total} RFQ${pagination.total === 1 ? "" : "s"}`}
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Search RFQs by title, category, or description...",
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
              icon={FileText}
              title={emptyTitle}
              description={emptyDescription}
              action={
                hasSearch ? (
                  <Button variant="secondary" onClick={() => setSearch("")}>
                    Clear search
                  </Button>
                ) : activeTab === "all" ? (
                  <Link href="/buyer/post-requirement">
                    <Button>
                      <Plus className="h-4 w-4" aria-hidden />
                      Post Requirement
                    </Button>
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {items.map((rfq) => (
                  <RfqListCard key={rfq.id} rfq={rfq} href={`/buyer/rfq/${rfq.id}`} variant="buyer" />
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

          {showPostPrompt ? (
            <div className="mt-6 rounded-2xl border border-dashed border-border bg-muted p-5 text-center">
              <p className="text-sm font-bold text-foreground">Need more quotes?</p>
              <p className="mt-1 text-xs text-muted-fg">
                Post a new requirement or publish drafts so sellers can start quoting.
              </p>
              <Link href="/buyer/post-requirement" className="mt-3 inline-block">
                <Button variant="secondary" size="sm">
                  Post requirement
                </Button>
              </Link>
            </div>
          ) : null}
        </div>

        <RfqListSidebar
          stats={[
            { label: "Total RFQs", value: loading ? "—" : pagination.total },
            { label: "New today", value: loading ? "—" : newTodayCount, highlight: newTodayCount > 0 },
            { label: "Quotes on this page", value: loading ? "—" : quotesOnPage, highlight: quotesOnPage > 0 },
          ]}
        />
      </div>
    </div>
  );
}
