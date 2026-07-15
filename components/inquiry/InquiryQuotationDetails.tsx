"use client";

import React from "react";
import { Paperclip } from "lucide-react";
import InquiryQuotationStatusBadge from "@/components/inquiry/InquiryQuotationStatusBadge";
import type { ApiInquiryQuotation } from "@/types/inquiry";
import { formatPrice, resolveImageUrl } from "@/utils/catalogHelpers";
import { formatInquiryDate } from "@/utils/inquiryHelpers";

function Detail({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) {
  if (value == null || value === "") return null;
  return (
    <div>
      <dt className="text-muted-fg">{label}</dt>
      <dd className="mt-0.5 font-semibold text-foreground">{value}</dd>
    </div>
  );
}

/**
 * Renders inquiry quotation fields from API shape:
 * price, quantity, unit, gst_*, transportation_charge, total_amount,
 * delivery_days, payment_terms, validity_days, remarks, attachment,
 * status, seller_name, company_name, quotation_number, dates.
 */
export default function InquiryQuotationDetails({
  quote,
  currency = "INR",
  title = "Quotation",
  showSeller = false,
  actions,
}: {
  quote: ApiInquiryQuotation;
  currency?: string | null;
  title?: string;
  /** Buyer view — show seller / company from quotation payload. */
  showSeller?: boolean;
  actions?: React.ReactNode;
}) {
  const cur = currency || "INR";
  const attachmentUrl = quote.attachment ? resolveImageUrl(quote.attachment) : null;
  const sellerLabel =
    quote.company_name?.trim() ||
    quote.seller_name?.trim() ||
    null;

  return (
    <div className="rounded-xl border border-border bg-muted/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {quote.quotation_number ? (
            <p className="mt-0.5 text-xs text-muted-fg">{quote.quotation_number}</p>
          ) : null}
        </div>
        <InquiryQuotationStatusBadge status={quote.status} />
      </div>

      {showSeller && sellerLabel ? (
        <p className="mt-2 text-sm text-muted-fg">
          From <span className="font-semibold text-foreground">{sellerLabel}</span>
          {quote.seller_name && quote.company_name ? (
            <span className="text-muted-fg"> · {quote.seller_name}</span>
          ) : null}
        </p>
      ) : null}

      <p className="mt-3 text-lg font-bold text-primary">
        {formatPrice(quote.price ?? 0, cur)}
        {quote.unit ? (
          <span className="ml-1 text-sm font-medium text-muted-fg">/ {quote.unit}</span>
        ) : null}
      </p>
      {quote.total_amount != null ? (
        <p className="mt-1 text-sm font-semibold text-foreground">
          Total {formatPrice(quote.total_amount, cur)}
        </p>
      ) : null}

      <dl className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
        <Detail label="Unit price" value={formatPrice(quote.price ?? 0, cur)} />
        <Detail
          label="Quantity"
          value={
            quote.quantity != null
              ? `${quote.quantity}${quote.unit ? ` ${quote.unit}` : ""}`
              : null
          }
        />
        <Detail
          label="GST %"
          value={quote.gst_percentage != null ? `${quote.gst_percentage}%` : null}
        />
        <Detail
          label="GST amount"
          value={
            quote.gst_amount != null ? formatPrice(quote.gst_amount, cur) : null
          }
        />
        <Detail
          label="Transportation"
          value={
            quote.transportation_charge != null
              ? formatPrice(quote.transportation_charge, cur)
              : null
          }
        />
        <Detail
          label="Delivery"
          value={
            quote.delivery_days != null ? `${quote.delivery_days} days` : null
          }
        />
        <Detail
          label="Payment terms"
          value={quote.payment_terms?.trim() || null}
        />
        <Detail
          label="Validity"
          value={
            quote.validity_days != null ? `${quote.validity_days} days` : null
          }
        />
        <Detail label="Created" value={formatInquiryDate(quote.created_at)} />
        <Detail label="Updated" value={formatInquiryDate(quote.updated_at)} />
      </dl>

      {quote.remarks?.trim() ? (
        <div className="mt-4">
          <p className="text-xs font-medium text-muted-fg">Remarks</p>
          <p className="mt-1 text-sm leading-relaxed text-foreground">
            {quote.remarks.trim()}
          </p>
        </div>
      ) : null}

      {attachmentUrl ? (
        <a
          href={attachmentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <Paperclip className="h-4 w-4" aria-hidden />
          View attachment
        </a>
      ) : null}

      {actions ? <div className="mt-4">{actions}</div> : null}
    </div>
  );
}
