"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Calendar, Clock, Loader2, MapPin, MessageSquare, Package, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/common/Button";
import PortalBackLink from "@/components/portal/PortalBackLink";
import QuotationCard from "@/components/rfq/QuotationCard";
import RfqStatusBadge from "@/components/rfq/RfqStatusBadge";
import { SubmitQuotationFormModal } from "@/components/rfq/SubmitQuotationForm";
import { ReviseQuotationFormModal } from "@/components/rfq/ReviseQuotationForm";
import { UpdateQuotationFormModal } from "@/components/rfq/UpdateQuotationForm";
import ChatSidePanel from "@/components/chat/ChatSidePanel";
import ConversationBadge, { useRfqChatUnread } from "@/components/chat/ConversationBadge";
import { useChat } from "@/context/ChatContext";
import { fetchSellerRfqById, findSellerQuotationForRfq, withdrawQuotation } from "@/services/rfqService";
import type { ApiQuotation, ApiRfqDetail } from "@/types/rfq";
import { formatPrice } from "@/utils/catalogHelpers";
import {
  canSellerSubmitQuotation,
  canSellerUpdateQuotation,
  canSellerWithdrawQuotation,
  formatRfqDate,
  formatRfqLocation,
  formatRfqQuantity,
  isQuotationRevisionPending,
} from "@/utils/rfqHelpers";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

function MetaPill({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-fg">
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="text-muted-fg">{label}</span>
      <span className="text-foreground">{value}</span>
    </span>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}

export default function SellerLeadDetailPage() {
  const params = useParams();
  const rfqId = Number(params.id);
  const invalidId = !rfqId || Number.isNaN(rfqId);
  const { hydrateRfqConversations } = useChat();
  const chatUnread = useRfqChatUnread(invalidId ? null : rfqId);

  const [rfq, setRfq] = useState<ApiRfqDetail | null>(null);
  const [existingQuotation, setExistingQuotation] = useState<ApiQuotation | null>(null);
  const [loading, setLoading] = useState(!invalidId);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [showReviseForm, setShowReviseForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const load = useCallback(async () => {
    if (invalidId) return;
    setLoading(true);
    try {
      const detail = await fetchSellerRfqById(rfqId);
      setRfq(detail);

      const embedded = detail?.my_quotation ?? null;
      const quotation = embedded ?? (detail ? await findSellerQuotationForRfq(rfqId) : null);
      setExistingQuotation(quotation);
      setShowQuoteForm(false);
      void hydrateRfqConversations(rfqId);
    } catch {
      setRfq(null);
      setExistingQuotation(null);
    } finally {
      setLoading(false);
    }
  }, [invalidId, rfqId, hydrateRfqConversations]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleWithdraw(quotationId: number) {
    setWithdrawing(true);
    try {
      await withdrawQuotation(quotationId);
      showSuccessToast("Quotation withdrawn");
      await load();
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Failed to withdraw quotation";
      showErrorToast(message);
    } finally {
      setWithdrawing(false);
    }
  }

  if (invalidId) {
    return (
      <PageShell>
        <PortalBackLink href="/seller/leads" label="RFQ Feed" />
        <p className="mt-4 text-sm text-red-600">Invalid RFQ id</p>
      </PageShell>
    );
  }

  if (loading) {
    return (
      <PageShell>
        <div className="border-b border-border pb-4">
          <PortalBackLink href="/seller/leads" label="RFQ Feed" />
        </div>
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-fg">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Loading RFQ...
        </div>
      </PageShell>
    );
  }

  if (!rfq) {
    return (
      <PageShell>
        <div className="border-b border-border pb-4">
          <PortalBackLink href="/seller/leads" label="RFQ Feed" />
        </div>
        <p className="mt-6 text-sm text-muted-fg">RFQ not found or no longer available.</p>
        <Link href="/seller/leads" className="mt-4 inline-block cursor-pointer text-sm font-semibold text-primary">
          Back to feed
        </Link>
      </PageShell>
    );
  }

  const canSubmit = canSellerSubmitQuotation(existingQuotation);
  const hasSentQuote = existingQuotation != null;
  const revisionPending =
    existingQuotation != null ? isQuotationRevisionPending(existingQuotation, rfq.status) : false;
  const quantity = formatRfqQuantity(rfq);
  const buyerLine = rfq.buyer_company?.trim() || null;
  const locationLine = rfq.city || rfq.state ? formatRfqLocation(rfq) : null;

  return (
    <PageShell>
      <div className="mb-5 border-b border-border pb-4">
        <PortalBackLink href="/seller/leads" label="RFQ Feed" />
      </div>

      <article className="surface-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <RfqStatusBadge status={rfq.status} />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-fg">
              <Calendar className="h-3.5 w-3.5" />
              Posted {formatRfqDate(rfq.created_at)}
            </span>
          </div>
          {hasSentQuote ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setChatOpen(true)}
              aria-label={
                chatUnread > 0
                  ? `Chat with buyer, ${chatUnread} unread message${chatUnread === 1 ? "" : "s"}`
                  : "Chat with buyer"
              }
              className="relative"
            >
              <span className="relative">
                <MessageSquare className="h-4 w-4" />
                {chatUnread > 0 ? (
                  <ConversationBadge
                    count={chatUnread}
                    size="md"
                    className="absolute -right-2.5 -top-2.5"
                  />
                ) : null}
              </span>
              Chat with buyer
              {chatUnread > 0 ? (
                <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold tabular-nums text-success">
                  {chatUnread > 99 ? "99+" : chatUnread} unread
                </span>
              ) : null}
            </Button>
          ) : null}
        </div>

        <div className="mt-4">
          <h1 className="text-xl font-extrabold text-foreground sm:text-2xl">{rfq.title}</h1>
          {buyerLine ? (
            <p className="mt-1 text-sm font-semibold text-muted-fg">
              {buyerLine}
              {locationLine ? ` · ${locationLine}` : ""}
            </p>
          ) : null}
          {rfq.category_name || rfq.subcategory_name ? (
            <p className="mt-0.5 text-xs font-medium text-muted-fg">
              {[rfq.category_name, rfq.subcategory_name].filter(Boolean).join(" · ")}
            </p>
          ) : null}
        </div>

        <div className="mt-5 border-t border-border pt-5">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-fg">Requirement</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-fg">
            {rfq.description || "No description provided."}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {quantity ? <MetaPill icon={Package} label="Qty" value={quantity} /> : null}
          <MetaPill
            icon={Clock}
            label="Deadline"
            value={formatRfqDate(rfq.quotation_deadline)}
          />
          {rfq.expected_price != null ? (
            <MetaPill
              icon={Wallet}
              label="Expected"
              value={formatPrice(rfq.expected_price, rfq.currency)}
            />
          ) : null}
          {locationLine ? <MetaPill icon={MapPin} label="Location" value={locationLine} /> : null}
        </div>

        {canSubmit ? (
          <Button
            type="button"
            onClick={() => setShowQuoteForm(true)}
            className="mt-6 w-full py-3.5 text-sm"
            fullWidth
          >
            Send Quote
          </Button>
        ) : null}

        {!canSubmit && existingQuotation ? (
          <div className="mt-6 border-t border-border pt-6">
            <QuotationCard
              quotation={existingQuotation}
              showSellerInfo={false}
              rfqStatus={rfq.status}
              actions={
                <>
                  {revisionPending ? (
                    <Button
                      size="sm"
                      onClick={() => setShowReviseForm(true)}
                    >
                      Revise quote
                    </Button>
                  ) : canSellerUpdateQuotation(existingQuotation.status) ? (
                    <Button
                      size="sm"
                      onClick={() => setShowUpdateForm(true)}
                    >
                      Update quote
                    </Button>
                  ) : null}
                  <Link href="/seller/quotations">
                    <Button size="sm" variant="secondary">
                      View in My Quotations
                    </Button>
                  </Link>
                  {canSellerWithdrawQuotation(existingQuotation.status, rfq.status) ? (
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={withdrawing}
                      onClick={() => void handleWithdraw(existingQuotation.id)}
                    >
                      Withdraw
                    </Button>
                  ) : null}
                </>
              }
            />
          </div>
        ) : null}
      </article>

      {hasSentQuote ? (
        <ChatSidePanel
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          title="Chat with Buyer"
          rfqId={rfq.id}
          role="seller"
          rfqTitle={rfq.title}
          rfqStatus={rfq.status}
          otherPartyName={buyerLine}
          quotations={existingQuotation ? [existingQuotation] : []}
        />
      ) : null}

      {canSubmit ? (
        <SubmitQuotationFormModal
          isOpen={showQuoteForm}
          onClose={() => setShowQuoteForm(false)}
          rfqTitle={rfq.title}
          rfqId={rfq.id}
          defaultQuantity={rfq.quantity}
          defaultUnit={rfq.unit}
          onSubmitted={() => {
            void load();
          }}
        />
      ) : null}

      {existingQuotation && revisionPending ? (
        <ReviseQuotationFormModal
          isOpen={showReviseForm}
          onClose={() => setShowReviseForm(false)}
          quotation={existingQuotation}
          onRevised={() => {
            void load();
          }}
        />
      ) : null}

      {existingQuotation && !revisionPending && canSellerUpdateQuotation(existingQuotation.status) ? (
        <UpdateQuotationFormModal
          isOpen={showUpdateForm}
          onClose={() => setShowUpdateForm(false)}
          quotation={existingQuotation}
          onUpdated={() => {
            void load();
          }}
        />
      ) : null}

      <Link
        href="/seller/leads"
        className="mt-4 block cursor-pointer text-center text-sm font-semibold text-muted-fg transition hover:text-primary"
      >
        Back to inbox
      </Link>
    </PageShell>
  );
}
