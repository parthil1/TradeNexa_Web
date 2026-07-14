"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import ConversationBadge, { useRfqChatUnread } from "@/components/chat/ConversationBadge";
import QuotationStatusBadge from "@/components/rfq/QuotationStatusBadge";
import type { ApiQuotation } from "@/types/rfq";
import { formatPrice } from "@/utils/catalogHelpers";
import {
  computeQuotationTotalWithGst,
  formatRfqDate,
  getBuyerRevisionRemarks,
  getQuotationStatusHint,
  getSellerRevisionStatusHint,
  isQuotationAccepted,
  isQuotationInactiveForBuyer,
  isQuotationRevisionPending,
  isRfqAwarded,
} from "@/utils/rfqHelpers";

interface QuotationCardProps {
  quotation: ApiQuotation;
  actions?: React.ReactNode;
  /** When false, shows "Your quotation" instead of seller identity. */
  showSellerInfo?: boolean;
  /** When true, shows RFQ product/title instead of seller identity (seller list view). */
  showProductName?: boolean;
  /** Dim inactive quotes and show status explanation (buyer view). */
  emphasizeStatus?: boolean;
  /** RFQ status helps detect negotiation when quotation status is still "Submitted". */
  rfqStatus?: string | null;
  /** Open chat (buyer ↔ seller depending on page). */
  onChatClick?: () => void;
  /** RFQ id for unread matching when quotation.rfq_id is absent */
  chatRfqId?: number | null;
  /** Navigate when the card body is clicked (e.g. seller quotations → lead detail). */
  href?: string;
  onCardClick?: () => void;
}

export default function QuotationCard({
  quotation,
  actions,
  showSellerInfo = true,
  showProductName = false,
  emphasizeStatus = false,
  rfqStatus,
  onChatClick,
  chatRfqId,
  href,
  onCardClick,
}: QuotationCardProps) {
  const router = useRouter();
  const [showRemarks, setShowRemarks] = useState(false);
  // Buyer cards match by seller_id; seller list/own-quote match by RFQ only.
  const matchSellerId =
    onChatClick && showSellerInfo && !showProductName ? quotation.seller_id : null;
  const chatUnread = useRfqChatUnread(
    onChatClick ? chatRfqId ?? quotation.rfq_id : null,
    matchSellerId
  );
  const accepted = isQuotationAccepted(quotation.status);
  const rfqAwarded = isRfqAwarded(rfqStatus);
  /** When RFQ is awarded, only the accepted quote stays active; others are disabled. */
  const disabled = emphasizeStatus && rfqAwarded && !accepted;
  const inactive =
    emphasizeStatus &&
    (disabled || (isQuotationInactiveForBuyer(quotation.status) && !accepted));
  const statusHint = emphasizeStatus
    ? disabled
      ? "This RFQ was awarded to another seller."
      : getQuotationStatusHint(quotation.status)
    : null;
  const sellerRevisionHint = !showSellerInfo ? getSellerRevisionStatusHint(quotation, rfqStatus) : null;
  const buyerRevisionRemarks = !showSellerInfo ? getBuyerRevisionRemarks(quotation, rfqStatus) : null;
  const revisionPending = isQuotationRevisionPending(quotation, rfqStatus);
  const totals = computeQuotationTotalWithGst(quotation);
  const company = quotation.seller_company?.trim();
  const contact = quotation.seller_name?.trim();
  const sellerPrimary = company || contact || "Seller";
  const sellerSecondary = company && contact ? contact : null;
  const productPrimary =
    quotation.product_name?.trim() || quotation.rfq_title?.trim() || "Quotation";
  const isClickable = Boolean(href || onCardClick);
  const chatLabel = showSellerInfo && !showProductName ? "Chat with seller" : "Chat with buyer";

  function handleCardActivate() {
    onCardClick?.();
    if (href) router.push(href);
  }

  function stopCardNav(event: React.SyntheticEvent) {
    event.stopPropagation();
  }

  return (
    <article
      className={`rounded-xl border p-4 sm:p-5 ${
        disabled
          ? "pointer-events-none border-border bg-muted opacity-50"
          : inactive
            ? "border-border bg-muted opacity-80"
            : isClickable
              ? "surface-card-hover"
              : "border-border bg-card"
      } ${isClickable && !disabled ? "cursor-pointer" : ""}`}
      onClick={isClickable && !disabled ? handleCardActivate : undefined}
      onKeyDown={
        isClickable && !disabled
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleCardActivate();
              }
            }
          : undefined
      }
      role={isClickable && !disabled ? "link" : undefined}
      tabIndex={isClickable && !disabled ? 0 : undefined}
      aria-label={isClickable && !disabled ? `Open ${productPrimary}` : undefined}
      aria-disabled={disabled || undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {showProductName ? (
            <p
              className={`truncate text-base font-semibold ${
                inactive ? "text-muted-fg" : "text-foreground"
              }`}
            >
              {productPrimary}
            </p>
          ) : showSellerInfo ? (
            <>
              <p
                className={`truncate text-base font-semibold ${
                  inactive ? "text-muted-fg" : "text-foreground"
                }`}
              >
                {sellerPrimary}
              </p>
              {sellerSecondary ? (
                <p className="mt-0.5 truncate text-xs text-muted-fg">
                  Contact: {sellerSecondary}
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-base font-semibold text-foreground">Your quotation</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {onChatClick && !disabled ? (
            <button
              type="button"
              onClick={(event) => {
                stopCardNav(event);
                onChatClick();
              }}
              title={chatLabel}
              aria-label={
                chatUnread > 0
                  ? `${chatLabel}, ${chatUnread} unread`
                  : chatLabel
              }
              className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-fg transition-colors duration-200 hover:border-primary/30 hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
            >
              <MessageSquare className="h-4 w-4" />
              {chatUnread > 0 ? (
                <ConversationBadge
                  count={chatUnread}
                  size="md"
                  className="absolute -right-1.5 -top-1.5"
                />
              ) : null}
            </button>
          ) : null}
          <QuotationStatusBadge status={quotation.status} className="shrink-0" />
        </div>
      </div>

      {totals ? (
        <div
          className={`mt-3.5 rounded-lg border px-4 py-3 ${
            inactive ? "border-border bg-muted" : "border-primary/15 bg-primary-soft/50"
          }`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-fg">Estimated total</p>
          <p className={`mt-1 text-xl font-semibold leading-none ${inactive ? "text-muted-fg" : "text-primary"}`}>
            {formatPrice(totals.total, quotation.currency)}
          </p>
          <p className="mt-1.5 text-xs text-muted-fg">
            {quotation.price != null && quotation.quantity != null
              ? `${formatPrice(quotation.price, quotation.currency)} × ${quotation.quantity} ${quotation.unit ?? ""}`.trim()
              : null}
            {quotation.gst_percentage != null ? ` + ${quotation.gst_percentage}% GST` : null}
            {quotation.transportation_charge != null && quotation.transportation_charge > 0
              ? ` + ${formatPrice(quotation.transportation_charge, quotation.currency)} transport`
              : null}
          </p>
        </div>
      ) : null}

      <div className="mt-3.5 grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-fg">Unit price</p>
          <p className={`mt-0.5 text-sm font-semibold ${inactive ? "text-muted-fg" : "text-foreground"}`}>
            {quotation.price != null ? formatPrice(quotation.price, quotation.currency) : "—"}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-fg">Quantity</p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">
            {quotation.quantity ?? "—"} {quotation.unit ?? ""}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-fg">Delivery</p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">
            {quotation.delivery_days != null ? `${quotation.delivery_days} days` : "—"}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-fg">GST</p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">
            {quotation.gst_percentage != null ? `${quotation.gst_percentage}%` : "—"}
          </p>
        </div>
      </div>

      {buyerRevisionRemarks ? (
        <div className="mt-3.5 rounded-lg border border-warning/25 bg-warning-soft px-3.5 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-warning">
            Buyer&apos;s revision request
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-fg">{buyerRevisionRemarks}</p>
        </div>
      ) : null}

      <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border pt-3 text-xs text-muted-fg">
        {quotation.payment_terms ? (
          <span>
            <span className="font-semibold text-foreground">Payment:</span> {quotation.payment_terms}
          </span>
        ) : null}
        {quotation.remarks && !(revisionPending && buyerRevisionRemarks) ? (
          <button
            type="button"
            onClick={(event) => {
              stopCardNav(event);
              setShowRemarks((v) => !v);
            }}
            className="cursor-pointer font-semibold text-primary hover:text-primary-hover"
          >
            {showRemarks ? "Hide remarks" : "View remarks"}
          </button>
        ) : null}
        <span className="ml-auto shrink-0">Submitted {formatRfqDate(quotation.created_at)}</span>
      </div>

      {showRemarks && quotation.remarks && !(revisionPending && buyerRevisionRemarks) ? (
        <p
          className="mt-1.5 text-sm leading-relaxed text-muted-fg"
          onClick={stopCardNav}
          onKeyDown={stopCardNav}
        >
          {quotation.remarks}
        </p>
      ) : null}

      {sellerRevisionHint ? (
        <p className="mt-3.5 rounded-lg border border-warning/20 bg-warning-soft/60 px-3.5 py-2.5 text-xs leading-relaxed text-muted-fg">
          {sellerRevisionHint}
        </p>
      ) : null}

      {statusHint ? (
        <p className="mt-3.5 rounded-lg border border-border bg-muted px-3.5 py-2.5 text-xs leading-relaxed text-muted-fg">
          {statusHint}
        </p>
      ) : null}

      {actions ? (
        <div
          className="mt-3.5 flex flex-wrap gap-2 border-t border-border pt-3.5"
          onClick={stopCardNav}
          onKeyDown={stopCardNav}
        >
          {actions}
        </div>
      ) : null}
    </article>
  );
}
