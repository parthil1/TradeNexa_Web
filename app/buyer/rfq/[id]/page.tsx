"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Calendar,
  Clock,
  FileText,
  Loader2,
  MapPin,
  Package,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/common/Button";
import PortalBackLink from "@/components/portal/PortalBackLink";
import PortalEmptyState from "@/components/portal/PortalEmptyState";
import PortalPagination from "@/components/portal/PortalPagination";
import QuotationCard from "@/components/rfq/QuotationCard";
import RequestRevisionModal from "@/components/rfq/RequestRevisionModal";
import DeleteRfqButton from "@/components/rfq/DeleteRfqButton";
import RfqStatusBadge from "@/components/rfq/RfqStatusBadge";
import {
  acceptQuotation,
  cancelRfq,
  fetchPublicRfqById,
  fetchRfqQuotations,
  publishRfq,
  rejectQuotation,
} from "@/services/rfqService";
import type { ApiQuotation, ApiRfqDetail } from "@/types/rfq";
import { formatPrice } from "@/utils/catalogHelpers";
import {
  formatRfqDate,
  formatRfqLocation,
  formatRfqQuantity,
  isQuotationActionableForBuyer,
  isQuotationAccepted,
  isRfqAwarded,
  isRfqDraft,
  isRfqInactiveStatus,
} from "@/utils/rfqHelpers";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import ChatSidePanel from "@/components/chat/ChatSidePanel";
import { useChat } from "@/context/ChatContext";

const QUOTATIONS_PAGE_SIZE = 5;

function DetailMetaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-muted p-3 ring-1 ring-border/80">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-fg" aria-hidden />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-fg">{label}</p>
        <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

export default function BuyerRfqDetailPage() {
  const params = useParams();
  const rfqId = Number(params.id);
  const invalidId = !rfqId || Number.isNaN(rfqId);

  const [rfq, setRfq] = useState<ApiRfqDetail | null>(null);
  const [rfqLoading, setRfqLoading] = useState(!invalidId);
  const [actionId, setActionId] = useState<number | null>(null);
  const [revisionFor, setRevisionFor] = useState<number | null>(null);
  const [chatTarget, setChatTarget] = useState<ApiQuotation | null>(null);
  const { hydrateRfqConversations } = useChat();

  const fetchQuotesPage = useCallback(
    (page: number) =>
      fetchRfqQuotations(rfqId, {
        page,
        limit: QUOTATIONS_PAGE_SIZE,
        sort_by: "created_at",
        sort_order: "desc",
      }),
    [rfqId]
  );

  const {
    items: quotations,
    pagination: quotesPagination,
    loading: quotesLoading,
    error: quotesError,
    goToPage: goToQuotesPage,
    reload: reloadQuotes,
  } = usePaginatedList({
    fetchPage: fetchQuotesPage,
    resetDeps: [rfqId],
    enabled: !invalidId,
  });

  const loadRfq = useCallback(async () => {
    if (invalidId) return;
    setRfqLoading(true);
    try {
      const detail = await fetchPublicRfqById(rfqId);
      setRfq(detail);
      void hydrateRfqConversations(rfqId);
    } catch {
      setRfq(null);
    } finally {
      setRfqLoading(false);
    }
  }, [invalidId, rfqId, hydrateRfqConversations]);

  useEffect(() => {
    void loadRfq();
  }, [loadRfq]);

  async function runQuotationAction(
    quotationId: number,
    action: "accept" | "reject"
  ) {
    setActionId(quotationId);
    try {
      if (action === "accept") {
        await acceptQuotation(quotationId);
        showSuccessToast("Quotation accepted");
      } else {
        await rejectQuotation(quotationId);
        showSuccessToast("Quotation rejected");
      }
      await Promise.all([loadRfq(), reloadQuotes()]);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Action failed";
      showErrorToast(message);
    } finally {
      setActionId(null);
    }
  }

  async function handlePublish() {
    if (!rfq) return;
    setActionId(-1);
    try {
      await publishRfq(rfq.id);
      showSuccessToast("RFQ published");
      await Promise.all([loadRfq(), reloadQuotes()]);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Failed to publish";
      showErrorToast(message);
    } finally {
      setActionId(null);
    }
  }

  async function handleCancel() {
    if (!rfq) return;
    setActionId(-2);
    try {
      await cancelRfq(rfq.id);
      showSuccessToast("RFQ cancelled");
      await Promise.all([loadRfq(), reloadQuotes()]);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Failed to cancel";
      showErrorToast(message);
    } finally {
      setActionId(null);
    }
  }

  if (invalidId) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
        <PortalBackLink href="/buyer/inquiries" label="My RFQs" />
        <p className="text-sm text-error">Invalid RFQ id</p>
      </div>
    );
  }

  if (rfqLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="border-b border-border pb-4">
          <PortalBackLink href="/buyer/inquiries" label="My RFQs" />
        </div>
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-fg">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Loading RFQ...
        </div>
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="border-b border-border pb-4">
          <PortalBackLink href="/buyer/inquiries" label="My RFQs" />
        </div>
        <PortalEmptyState
          icon={FileText}
          title="RFQ not found"
          description="This requirement may have been removed."
          action={
            <Link href="/buyer/inquiries">
              <Button>Back to RFQs</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const status = (rfq.status ?? "").toUpperCase();
  const isDraft = isRfqDraft(rfq.status);
  const isInactive = isRfqInactiveStatus(rfq.status);
  const canCancel =
    !isDraft && !status.includes("CANCEL") && !status.includes("CLOSE");
  const quantity = formatRfqQuantity(rfq);
  const totalQuotes = Math.max(quotesPagination.total, rfq.quotations_count ?? 0, quotations.length);
  const actionableCount = quotations.filter((q) =>
    isQuotationActionableForBuyer(q.status, rfq.status)
  ).length;
  const quotesMismatch = !quotesLoading && totalQuotes > 0 && quotations.length === 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
      <div className="mb-6 border-b border-border pb-5">
        <PortalBackLink href="/buyer/inquiries" label="My RFQs" />
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1
              className={`text-2xl font-semibold tracking-tight sm:text-3xl ${
                isInactive ? "text-muted-fg" : "text-foreground"
              }`}
            >
              {rfq.title}
            </h1>
            <p className="mt-1 text-sm text-muted-fg">Requirement details and seller quotations</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <RfqStatusBadge status={rfq.status} />
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1 text-xs font-semibold text-muted-fg">
              <Calendar className="h-3.5 w-3.5" />
              Posted {formatRfqDate(rfq.created_at)}
            </span>
            {rfq.quotation_deadline ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1 text-xs font-semibold text-muted-fg">
                <Clock className="h-3.5 w-3.5" />
                Deadline {formatRfqDate(rfq.quotation_deadline)}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(340px,420px)] lg:items-start lg:gap-8">
        <section>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-fg">Requirement</p>

          <article
            className={`surface-card mt-2 p-5 sm:p-6 ${
              isInactive
                ? "border-error/25 border-l-4 border-l-error"
                : ""
            }`}
          >
            {isInactive ? (
              <p className="mb-4 text-xs font-semibold text-error">
                This RFQ is {status.includes("CANCEL") ? "cancelled" : status.toLowerCase()} and is no longer
                accepting new quotes.
              </p>
            ) : null}

            {rfq.description ? (
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-fg">Description</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-fg">{rfq.description}</p>
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {quantity ? (
                <DetailMetaItem icon={Package} label="Quantity" value={quantity} />
              ) : null}
              <DetailMetaItem icon={MapPin} label="Location" value={formatRfqLocation(rfq)} />
              <DetailMetaItem
                icon={Clock}
                label="Quote deadline"
                value={formatRfqDate(rfq.quotation_deadline)}
              />
              {rfq.expected_price != null ? (
                <DetailMetaItem
                  icon={Wallet}
                  label="Expected price"
                  value={formatPrice(rfq.expected_price, rfq.currency)}
                />
              ) : null}
              {rfq.payment_terms ? (
                <DetailMetaItem icon={FileText} label="Payment terms" value={rfq.payment_terms} />
              ) : null}
              {rfq.category_name || rfq.subcategory_name ? (
                <DetailMetaItem
                  icon={FileText}
                  label="Category"
                  value={[rfq.category_name, rfq.subcategory_name].filter(Boolean).join(" · ")}
                />
              ) : null}
            </div>

            {(isDraft || canCancel) && (
              <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-5">
                {isDraft ? (
                  <>
                    <Link href={`/buyer/rfq/${rfq.id}/edit`}>
                      <Button variant="outline" size="sm">
                        Edit draft
                      </Button>
                    </Link>
                    <Button
                      type="button"
                      size="sm"
                      disabled={actionId !== null}
                      onClick={() => void handlePublish()}
                    >
                      Publish RFQ
                    </Button>
                    <DeleteRfqButton rfqId={rfq.id} rfqTitle={rfq.title} />
                  </>
                ) : null}
                {canCancel ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    disabled={actionId !== null}
                    onClick={() => void handleCancel()}
                  >
                    Cancel RFQ
                  </Button>
                ) : null}
              </div>
            )}
          </article>
        </section>

        <section className="mt-8 lg:mt-0">
          <div className="lg:sticky lg:top-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-fg">Quotations</p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">
              {quotesLoading && totalQuotes === 0
                ? "Loading quotes..."
                : totalQuotes === 0
                  ? "No quotes yet"
                  : `${totalQuotes} quote${totalQuotes === 1 ? "" : "s"} received`}
            </h2>
            {actionableCount > 0 ? (
              <p className="mt-1 text-xs text-primary">
                {actionableCount} on this page awaiting your decision
              </p>
            ) : null}

            {quotesError ? (
              <p className="mt-3 rounded-xl border border-error/20 bg-error-soft p-3 text-xs text-error">
                {quotesError}
              </p>
            ) : null}

            {quotesLoading && quotations.length === 0 ? (
              <div className="mt-4 flex items-center justify-center gap-2 py-12 text-sm text-muted-fg">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Loading quotations...
              </div>
            ) : quotesMismatch ? (
              <div className="mt-4 rounded-xl border border-warning/30 bg-warning-soft p-6 text-center">
                <p className="text-sm font-semibold text-foreground">Could not load quotations</p>
                <p className="mt-1 text-xs text-muted-fg">
                  This RFQ shows {totalQuotes} quote{totalQuotes === 1 ? "" : "s"}, but the list did not load.
                  Try refreshing.
                </p>
                <div className="mt-3">
                  <Button size="sm" onClick={() => void reloadQuotes()}>
                    Retry
                  </Button>
                </div>
              </div>
            ) : totalQuotes === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-border bg-muted p-6 text-center">
                <FileText className="mx-auto h-8 w-8 text-muted-fg" />
                <p className="mt-3 text-sm font-semibold text-foreground">No quotations yet</p>
                <p className="mt-1 text-xs text-muted-fg">
                  Sellers will submit quotes here once your RFQ is live.
                </p>
              </div>
            ) : (
              <>
                <div className="mt-4 space-y-4">
                  {quotations.map((quotation) => {
                    const awarded = isRfqAwarded(rfq.status);
                    const accepted = isQuotationAccepted(quotation.status);
                    const showActions =
                      !awarded && isQuotationActionableForBuyer(quotation.status, rfq.status);

                    return (
                  <QuotationCard
                    key={quotation.id}
                    quotation={quotation}
                    emphasizeStatus
                    rfqStatus={rfq.status}
                    chatRfqId={rfq.id}
                    onChatClick={
                      awarded && !accepted
                        ? undefined
                        : () => setChatTarget(quotation)
                    }
                    actions={
                      showActions ? (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            disabled={actionId === quotation.id}
                            onClick={() => void runQuotationAction(quotation.id, "accept")}
                            className="bg-success hover:bg-success/90"
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            disabled={actionId === quotation.id}
                            onClick={() => void runQuotationAction(quotation.id, "reject")}
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={actionId === quotation.id}
                            onClick={() => setRevisionFor(quotation.id)}
                          >
                            Request revision
                          </Button>
                        </>
                      ) : undefined
                    }
                  />
                    );
                  })}
                </div>
                <PortalPagination
                  pagination={quotesPagination}
                  onPageChange={goToQuotesPage}
                  loading={quotesLoading}
                  itemLabel="quotes"
                  compact
                />
              </>
            )}
          </div>
        </section>
      </div>

      <ChatSidePanel
        open={chatTarget !== null}
        onClose={() => setChatTarget(null)}
        title="Chat with Seller"
        rfqId={rfq.id}
        role="buyer"
        rfqStatus={rfq.status}
        sellerId={chatTarget?.seller_id ?? null}
        otherPartyName={
          chatTarget?.seller_company?.trim() ||
          chatTarget?.seller_name?.trim() ||
          null
        }
        productId={rfq.product_id ?? rfq.product?.id ?? null}
        productName={rfq.product_name ?? rfq.product?.name ?? null}
      />

      <RequestRevisionModal
        isOpen={revisionFor !== null}
        quotationId={revisionFor}
        onClose={() => setRevisionFor(null)}
        onRequested={() => {
          void Promise.all([loadRfq(), reloadQuotes()]);
        }}
      />
    </div>
  );
}
