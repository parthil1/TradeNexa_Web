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
import InquiryQuotationDetails from "@/components/inquiry/InquiryQuotationDetails";
import { SubmitInquiryQuotationModal } from "@/components/inquiry/SubmitInquiryQuotationForm";
import { RejectInquiryModal } from "@/components/inquiry/RejectInquiryModal";
import {
  fetchInquiryById,
  getInquiryErrorMessage,
  rejectInquiry,
  withdrawInquiryQuotation,
} from "@/services/inquiryService";
import {
  formatInquiryDate,
  inquiryCounterpartyLogo,
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
  const [rejectOpen, setRejectOpen] = useState(false);

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

  async function handleReject(reason: string) {
    if (!inquiry) return;
    setActionLoading(true);
    try {
      const updated = await rejectInquiry(inquiry.id, {
        reason: reason || undefined,
      });
      setInquiry(updated);
      setRejectOpen(false);
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
      const updated = await withdrawInquiryQuotation(inquiry.quotation.id, inquiry.id);
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
  const buyerLogo = inquiryCounterpartyLogo(inquiry, "seller");
  const quote = inquiry.quotation;
  const quoteStatus = String(quote?.status ?? "").toUpperCase();
  const canQuote = inquiry.status === "pending" && !quote;
  const canReject = inquiry.status === "pending";
  const canUpdateQuote =
    Boolean(quote?.id) &&
    (quoteStatus === "SUBMITTED" || quoteStatus === "UPDATED");
  const canWithdraw =
    inquiry.status === "quoted" &&
    quote &&
    (quoteStatus === "SUBMITTED" || quoteStatus === "UPDATED");

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
          <InquiryQuotationDetails
            quote={quote}
            currency={inquiry.currency}
            title="Your quotation"
            actions={
              canUpdateQuote || canWithdraw ? (
                <div className="flex flex-wrap gap-2">
                  {canUpdateQuote ? (
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => setQuoteOpen(true)}
                    >
                      Update quotation
                    </Button>
                  ) : null}
                  {canWithdraw ? (
                    <Button
                      type="button"
                      variant="secondary"
                      loading={actionLoading}
                      onClick={() => void handleWithdrawQuote()}
                    >
                      Withdraw quotation
                    </Button>
                  ) : null}
                </div>
              ) : null
            }
          />
        ) : null}

        <div className="flex flex-wrap gap-2">
          {canQuote ? (
            <Button type="button" variant="primary" onClick={() => setQuoteOpen(true)}>
              Send quotation
            </Button>
          ) : null}
          {canReject ? (
            <Button type="button" variant="secondary" onClick={() => setRejectOpen(true)}>
              Reject inquiry
            </Button>
          ) : null}
        </div>
      </div>

      <RejectInquiryModal
        isOpen={rejectOpen}
        onClose={() => setRejectOpen(false)}
        productTitle={title}
        submitting={actionLoading}
        onConfirm={handleReject}
      />

      <SubmitInquiryQuotationModal
        isOpen={quoteOpen}
        onClose={() => setQuoteOpen(false)}
        inquiryId={inquiry.id}
        productTitle={title}
        quotationId={canUpdateQuote ? quote?.id : null}
        initialQuotation={canUpdateQuote ? quote : null}
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
        otherPartyLogo={buyerLogo}
      />
    </div>
  );
}
