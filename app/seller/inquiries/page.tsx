"use client";

import React, { useCallback, useEffect, useState } from "react";
import { FileText, Loader2, Package } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import PortalEmptyState from "@/components/portal/PortalEmptyState";
import PortalPagination from "@/components/portal/PortalPagination";
import InquiryListCard from "@/components/inquiry/InquiryListCard";
import { useChat } from "@/context/ChatContext";
import { fetchSellerInquiries } from "@/services/inquiryService";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  INQUIRY_STATUS_TABS,
  formatInquiryStatusLabel,
  inquiryTabToApiStatus,
  type InquiryStatusTab,
} from "@/utils/inquiryHelpers";
import { portalFilterChipClass } from "@/components/portal/portalLayout";

const PAGE_SIZE = 6;

export default function SellerInquiriesPage() {
  const [activeTab, setActiveTab] = useState<InquiryStatusTab>("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const { syncConversationsUnread } = useChat();

  useEffect(() => {
    void syncConversationsUnread();
  }, [syncConversationsUnread]);

  const fetchPage = useCallback(
    (page: number) =>
      fetchSellerInquiries({
        page,
        limit: PAGE_SIZE,
        sort_by: "created_at",
        sort_order: "desc",
        status: inquiryTabToApiStatus(activeTab),
        search: debouncedSearch || undefined,
      }),
    [activeTab, debouncedSearch]
  );

  const { items, pagination, loading, error, goToPage } = usePaginatedList({
    fetchPage,
    resetDeps: [activeTab, debouncedSearch],
  });

  const hasSearch = debouncedSearch.trim().length > 0;
  const tabLabel = formatInquiryStatusLabel(activeTab).toLowerCase();

  return (
    <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:px-8">
      <PortalPageHeader
        title="Product inquiries"
        subtitle="Buyer questions on your catalog products"
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {INQUIRY_STATUS_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={portalFilterChipClass(activeTab === tab)}
            >
              {formatInquiryStatusLabel(tab)}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search inquiries…"
          className="input-base max-w-xs"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : error ? (
        <PortalEmptyState
          icon={FileText}
          title="Could not load inquiries"
          description={error}
        />
      ) : items.length === 0 ? (
        <PortalEmptyState
          icon={Package}
          title={
            hasSearch
              ? "No inquiries match your search"
              : activeTab === "all"
                ? "No product inquiries yet"
                : `No ${tabLabel} inquiries`
          }
          description={
            hasSearch
              ? `No results for "${debouncedSearch.trim()}".`
              : "When buyers inquire on your products, they will appear here."
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((inquiry) => (
              <InquiryListCard
                key={inquiry.id}
                inquiry={inquiry}
                href={`/seller/inquiries/${inquiry.id}`}
                variant="seller"
              />
            ))}
          </div>
          <div className="mt-6">
            <PortalPagination pagination={pagination} onPageChange={goToPage} />
          </div>
        </>
      )}
    </div>
  );
}
