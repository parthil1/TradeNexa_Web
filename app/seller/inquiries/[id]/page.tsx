"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2, MessageSquare } from "lucide-react";
import PortalBackLink from "@/components/portal/PortalBackLink";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import { Button } from "@/components/common/Button";
import ChatSidePanel from "@/components/chat/ChatSidePanel";
import InquiryStatusBadge from "@/components/inquiry/InquiryStatusBadge";
import { SubmitInquiryQuotationModal } from "@/components/inquiry/SubmitInquiryQuotationForm";
import {
  fetchInquiryById,
  getInquiryErrorMessage,
  rejectInquiry,
  withdrawInquiryQuotation,
} from "@/services/inquiryService";
import {
  formatInquiryDate,
  inquiryCounterpartyName,
  inquiryProductTitle,
} from "@/utils/inquiryHelpers";
import { formatPrice } from "@/utils/catalogHelpers";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import type { ApiInquiry } from "@/types/inquiry";

export default function SellerInquiryDetailPage() {
  const params = useParams();
  const inquiryId = Number(params.id);
  const [inquiry, setInquiry] = useState<ApiInquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const load = useCallback(async () => {
    if (!inquiryId || Number.isNaN(inquiryId)) return;
    setLoading(true);
    try {
      const data = await fetchInquiryById(inquiryId);
      setInquiry(data);
    } catch (err) {
      showErrorToast(getInquiryErrorMessage(err, "Could not load inquiry"));
      setInquiry(null);
    } finally {
      setLoading(false);
    }
  }, [inquiryId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleReject() {
    if (!inquiry) return;
    setActionLoading(true);
    try {
      const updated = await rejectInquiry(inquiry.id, {
        reason: rejectReason.trim() || undefined,
      });
      setInquiry(updated);
      showSuccessToast("Inquiry rejected");
    } catch (err) {
      showErrorToast(getInquiryErrorMessage(err, "Could not reject inquiry"));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleWithdrawQuote() {
    if (!inquiry?.quotation?.id) return;
    setActionLoading(true);
    try {
      const updated = await withdrawInquiryQuotation(inquiry.quotation.id);
      setInquiry(updated);
      showSuccessToast("Quotation withdrawn");
    } catch (err) {
      showErrorToast(getInquiryErrorMessage(err, "Could not withdraw quotation"));
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!inquiry) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-5">
        <PortalBackLink href="/seller/inquiries" />
        <p className="mt-6 text-sm text-muted-fg">Inquiry not found.</p>
      </div>
    );
  }

  const title = inquiryProductTitle(inquiry);
  const buyerName = inquiryCounterpartyName(inquiry, "seller");
  const quote = inquiry.quotation;
  const canQuote = inquiry.status === "pending";
  const canReject = inquiry.status === "pending";
  const canWithdraw =
    inquiry.status === "quoted" &&
    quote &&
    (quote.status === "SUBMITTED" || quote.status === "UPDATED");

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 lg:px-8">
      <PortalBackLink href="/seller/inquiries" />
      <PortalPageHeader
        title={title}
        subtitle={inquiry.inquiry_number || `Inquiry #${inquiry.id}`}
        action={<InquiryStatusBadge status={inquiry.status} />}
      />

      <div className="surface-card space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-fg">Buyer</p>
            <p className="font-semibold text-foreground">{buyerName}</p>
          </div>
          <Button
            type="button"
            variant="primary"
            onClick={() => setChatOpen(true)}
            className="inline-flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Reply in chat
          </Button>
        </div>

        <dl className="grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-muted-fg">Quantity</dt>
            <dd className="font-semibold text-foreground">
              {inquiry.quantity} {inquiry.unit || ""}
            </dd>
          </div>
          <div>
            <dt className="text-muted-fg">Received</dt>
            <dd className="font-semibold text-foreground">
              {formatInquiryDate(inquiry.created_at)}
            </dd>
          </div>
          {inquiry.expected_price != null ? (
            <div>
              <dt className="text-muted-fg">Buyer target</dt>
              <dd className="font-semibold text-foreground">
                {formatPrice(inquiry.expected_price, inquiry.currency || "INR")}
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="text-muted-fg">Product</dt>
            <dd>
              <Link
                href={`/seller/product/${inquiry.product_id}`}
                className="font-semibold text-primary"
              >
                View product
              </Link>
            </dd>
          </div>
        </dl>

        {inquiry.message ? (
          <div>
            <p className="text-sm text-muted-fg">Buyer message</p>
            <p className="mt-1 text-sm leading-relaxed text-foreground">{inquiry.message}</p>
          </div>
        ) : null}

        {quote ? (
          <div className="rounded-xl border border-border bg-muted/50 p-4">
            <p className="text-sm font-semibold text-foreground">Your quotation</p>
            <p className="mt-2 text-lg font-bold text-primary">
              {formatPrice(quote.price ?? 0, inquiry.currency || "INR")}
            </p>
            {quote.total_amount != null ? (
              <p className="mt-1 text-sm text-muted-fg">
                Total {formatPrice(quote.total_amount, inquiry.currency || "INR")}
              </p>
            ) : null}
            {canWithdraw ? (
              <Button
                type="button"
                variant="secondary"
                className="mt-3"
                loading={actionLoading}
                onClick={() => void handleWithdrawQuote()}
              >
                Withdraw quotation
              </Button>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {canQuote ? (
            <Button type="button" variant="primary" onClick={() => setQuoteOpen(true)}>
              Send quotation
            </Button>
          ) : null}
        </div>

        {canReject ? (
          <div className="space-y-2 border-t border-border pt-4">
            <label className="block text-sm font-medium text-foreground">
              Reject reason (optional)
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={2}
              className="w-full resize-y rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
              placeholder="Unable to fulfill quantity…"
            />
            <Button
              type="button"
              variant="secondary"
              loading={actionLoading}
              onClick={() => void handleReject()}
            >
              Reject inquiry
            </Button>
          </div>
        ) : null}
      </div>

      <SubmitInquiryQuotationModal
        isOpen={quoteOpen}
        onClose={() => setQuoteOpen(false)}
        inquiryId={inquiry.id}
        productTitle={title}
        defaultQuantity={inquiry.quantity}
        defaultUnit={inquiry.unit}
        onSubmitted={() => void load()}
      />

      <ChatSidePanel
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        title="Chat with Buyer"
        role="seller"
        inquiryId={inquiry.id}
        conversationId={inquiry.conversation_id}
        productId={inquiry.product_id}
        productName={title}
        otherPartyName={buyerName}
      />
    </div>
  );
}
