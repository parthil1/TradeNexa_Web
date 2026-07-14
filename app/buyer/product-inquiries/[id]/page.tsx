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
import {
  acceptInquiryQuotation,
  cancelInquiry,
  fetchInquiryById,
  getInquiryErrorMessage,
  rejectInquiryQuotation,
} from "@/services/inquiryService";
import {
  formatInquiryDate,
  inquiryCounterpartyName,
  inquiryProductTitle,
} from "@/utils/inquiryHelpers";
import { formatPrice } from "@/utils/catalogHelpers";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import type { ApiInquiry } from "@/types/inquiry";

export default function BuyerProductInquiryDetailPage() {
  const params = useParams();
  const inquiryId = Number(params.id);
  const [inquiry, setInquiry] = useState<ApiInquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const load = useCallback(async () => {
    if (!inquiryId || Number.isNaN(inquiryId)) return;
    setLoading(true);
    try {
      const data = await fetchInquiryById(inquiryId, { mark_viewed: false });
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

  async function handleCancel() {
    if (!inquiry) return;
    setActionLoading(true);
    try {
      const updated = await cancelInquiry(inquiry.id);
      setInquiry(updated);
      showSuccessToast("Inquiry cancelled");
    } catch (err) {
      showErrorToast(getInquiryErrorMessage(err, "Could not cancel inquiry"));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAcceptQuote() {
    if (!inquiry?.quotation?.id) return;
    setActionLoading(true);
    try {
      const updated = await acceptInquiryQuotation(inquiry.quotation.id);
      setInquiry(updated);
      showSuccessToast("Quotation accepted");
    } catch (err) {
      showErrorToast(getInquiryErrorMessage(err, "Could not accept quotation"));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRejectQuote() {
    if (!inquiry?.quotation?.id) return;
    setActionLoading(true);
    try {
      const updated = await rejectInquiryQuotation(inquiry.quotation.id);
      setInquiry(updated);
      showSuccessToast("Quotation rejected — seller can re-quote");
    } catch (err) {
      showErrorToast(getInquiryErrorMessage(err, "Could not reject quotation"));
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
        <PortalBackLink href="/buyer/product-inquiries" />
        <p className="mt-6 text-sm text-muted-fg">Inquiry not found.</p>
      </div>
    );
  }

  const title = inquiryProductTitle(inquiry);
  const sellerName = inquiryCounterpartyName(inquiry, "buyer");
  const quote = inquiry.quotation;

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 lg:px-8">
      <PortalBackLink href="/buyer/product-inquiries" />
      <PortalPageHeader
        title={title}
        subtitle={inquiry.inquiry_number || `Inquiry #${inquiry.id}`}
        action={<InquiryStatusBadge status={inquiry.status} />}
      />

      <div className="surface-card space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-fg">Seller</p>
            <p className="font-semibold text-foreground">{sellerName}</p>
          </div>
          <Button
            type="button"
            variant="primary"
            onClick={() => setChatOpen(true)}
            className="inline-flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Open chat
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
            <dt className="text-muted-fg">Created</dt>
            <dd className="font-semibold text-foreground">
              {formatInquiryDate(inquiry.created_at)}
            </dd>
          </div>
          {inquiry.expected_price != null ? (
            <div>
              <dt className="text-muted-fg">Expected price</dt>
              <dd className="font-semibold text-foreground">
                {formatPrice(inquiry.expected_price, inquiry.currency || "INR")}
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="text-muted-fg">Product</dt>
            <dd>
              <Link
                href={`/buyer/product/${inquiry.product_id}`}
                className="font-semibold text-primary"
              >
                View product
              </Link>
            </dd>
          </div>
        </dl>

        {inquiry.message ? (
          <div>
            <p className="text-sm text-muted-fg">Your message</p>
            <p className="mt-1 text-sm leading-relaxed text-foreground">{inquiry.message}</p>
          </div>
        ) : null}

        {quote ? (
          <div className="rounded-xl border border-border bg-muted/50 p-4">
            <p className="text-sm font-semibold text-foreground">Seller quotation</p>
            <p className="mt-2 text-lg font-bold text-primary">
              {formatPrice(quote.price ?? 0, inquiry.currency || "INR")}
              {quote.unit ? (
                <span className="ml-1 text-sm font-medium text-muted-fg">/ {quote.unit}</span>
              ) : null}
            </p>
            {quote.total_amount != null ? (
              <p className="mt-1 text-sm text-muted-fg">
                Total {formatPrice(quote.total_amount, inquiry.currency || "INR")}
              </p>
            ) : null}
            {quote.remarks ? (
              <p className="mt-2 text-sm text-muted-fg">{quote.remarks}</p>
            ) : null}
            {inquiry.status === "quoted" ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="primary"
                  loading={actionLoading}
                  onClick={() => void handleAcceptQuote()}
                >
                  Accept quote
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={actionLoading}
                  onClick={() => void handleRejectQuote()}
                >
                  Reject quote
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        {inquiry.status === "pending" ? (
          <Button
            type="button"
            variant="secondary"
            loading={actionLoading}
            onClick={() => void handleCancel()}
          >
            Cancel inquiry
          </Button>
        ) : null}
      </div>

      <ChatSidePanel
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        title="Chat with Seller"
        role="buyer"
        inquiryId={inquiry.id}
        conversationId={inquiry.conversation_id}
        productId={inquiry.product_id}
        productName={title}
        otherPartyName={sellerName}
      />
    </div>
  );
}
