"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, MessageSquare } from "lucide-react";
import PortalBackLink from "@/components/portal/PortalBackLink";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import PortalEmptyState from "@/components/portal/PortalEmptyState";
import PortalPagination from "@/components/portal/PortalPagination";
import { Button } from "@/components/common/Button";
import RfqListToolbar from "@/components/rfq/RfqListToolbar";
import QuotationCard from "@/components/rfq/QuotationCard";
import ChatSidePanel from "@/components/chat/ChatSidePanel";
import { ReviseQuotationFormModal } from "@/components/rfq/ReviseQuotationForm";
import { UpdateQuotationFormModal } from "@/components/rfq/UpdateQuotationForm";
import { useChat } from "@/context/ChatContext";
import { fetchSellerQuotations, withdrawQuotation } from "@/services/rfqService";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { ApiQuotation } from "@/types/rfq";
import {
  canSellerUpdateQuotation,
  canSellerWithdrawQuotation,
  isQuotationRevisionPending,
} from "@/utils/rfqHelpers";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

const PAGE_SIZE = 5;

export default function SellerQuotationsPage() {
  const [withdrawingId, setWithdrawingId] = useState<number | null>(null);
  const [revisingQuotation, setRevisingQuotation] = useState<ApiQuotation | null>(null);
  const [updatingQuotation, setUpdatingQuotation] = useState<ApiQuotation | null>(null);
  const [chatTarget, setChatTarget] = useState<ApiQuotation | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const { syncConversationsUnread } = useChat();

  const fetchPage = useCallback(
    (page: number) =>
      fetchSellerQuotations({
        page,
        limit: PAGE_SIZE,
        sort_by: "created_at",
        sort_order: "desc",
        search: debouncedSearch || undefined,
      }),
    [debouncedSearch]
  );

  const { items, pagination, loading, error, goToPage, reload } = usePaginatedList({
    fetchPage,
    resetDeps: [debouncedSearch],
  });

  const hasSearch = debouncedSearch.trim().length > 0;

  // One list sync for unread badges — avoid per-RFQ `/chats/rfqs/:id/conversations` (403 for sellers).
  useEffect(() => {
    if (items.length === 0) return;
    void syncConversationsUnread();
  }, [items, syncConversationsUnread]);

  async function handleWithdraw(quotationId: number) {
    setWithdrawingId(quotationId);
    try {
      await withdrawQuotation(quotationId);
      showSuccessToast("Quotation withdrawn");
      reload();
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Failed to withdraw quotation";
      showErrorToast(message);
    } finally {
      setWithdrawingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 lg:px-8">
      <PortalBackLink href="/seller/leads" label="RFQ Feed" />
      <PortalPageHeader title="My Quotations" subtitle="Quotes you have submitted to buyers" />

      <RfqListToolbar
        loading={loading}
        countLabel={`${pagination.total} quotation${pagination.total === 1 ? "" : "s"}`}
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Search by RFQ title, buyer, or remarks...",
        }}
      />

      {error ? (
        <p className="mb-4 rounded-xl border border-error/20 bg-error-soft p-3 text-sm text-error">{error}</p>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-fg">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Loading quotations...
        </div>
      ) : items.length === 0 ? (
        <PortalEmptyState
          icon={MessageSquare}
          title={hasSearch ? "No quotations match your search" : "No quotations yet"}
          description={
            hasSearch
              ? `No results for "${debouncedSearch.trim()}". Try a different keyword or clear the search.`
              : "Browse the RFQ feed and submit your first quote."
          }
          action={
            hasSearch ? (
              <Button type="button" variant="secondary" onClick={() => setSearch("")}>
                Clear search
              </Button>
            ) : (
              <Link href="/seller/leads">
                <Button>Browse RFQs</Button>
              </Link>
            )
          }
        />
      ) : (
        <>
          <div className="space-y-4">
            {items.map((quotation) => {
              const revisionPending = isQuotationRevisionPending(
                quotation,
                quotation.rfq_status
              );
              const canUpdate =
                !revisionPending && canSellerUpdateQuotation(quotation.status);
              const canWithdraw = canSellerWithdrawQuotation(
                quotation.status,
                quotation.rfq_status
              );
              const hasActions = revisionPending || canUpdate || canWithdraw;

              return (
              <QuotationCard
                key={quotation.id}
                quotation={quotation}
                showProductName
                rfqStatus={quotation.rfq_status}
                href={quotation.rfq_id ? `/seller/lead/${quotation.rfq_id}` : undefined}
                chatRfqId={quotation.rfq_id}
                onChatClick={
                  quotation.rfq_id ? () => setChatTarget(quotation) : undefined
                }
                actions={
                  hasActions ? (
                  <>
                    {revisionPending ? (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setRevisingQuotation(quotation)}
                      >
                        Revise quote
                      </Button>
                    ) : canUpdate ? (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setUpdatingQuotation(quotation)}
                      >
                        Update quote
                      </Button>
                    ) : null}
                    {canWithdraw ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        disabled={withdrawingId === quotation.id}
                        onClick={() => void handleWithdraw(quotation.id)}
                      >
                        Withdraw
                      </Button>
                    ) : null}
                  </>
                  ) : undefined
                }
              />
              );
            })}
          </div>
          <PortalPagination
            pagination={pagination}
            onPageChange={goToPage}
            loading={loading}
            itemLabel="quotations"
            compact
          />
        </>
      )}

      <ChatSidePanel
        open={chatTarget !== null}
        onClose={() => setChatTarget(null)}
        title="Chat with Buyer"
        rfqId={chatTarget?.rfq_id ?? 0}
        role="seller"
        rfqTitle={
          chatTarget?.rfq_title?.trim() ||
          chatTarget?.product_name?.trim() ||
          null
        }
        rfqStatus={chatTarget?.rfq_status}
        otherPartyName={
          chatTarget?.buyer_company?.trim() ||
          chatTarget?.buyer_name?.trim() ||
          null
        }
        quotations={chatTarget ? [chatTarget] : []}
      />

      {revisingQuotation ? (
        <ReviseQuotationFormModal
          isOpen={Boolean(revisingQuotation)}
          onClose={() => setRevisingQuotation(null)}
          quotation={revisingQuotation}
          onRevised={() => {
            setRevisingQuotation(null);
            reload();
          }}
        />
      ) : null}

      {updatingQuotation ? (
        <UpdateQuotationFormModal
          isOpen={Boolean(updatingQuotation)}
          onClose={() => setUpdatingQuotation(null)}
          quotation={updatingQuotation}
          onUpdated={() => {
            setUpdatingQuotation(null);
            reload();
          }}
        />
      ) : null}
    </div>
  );
}
