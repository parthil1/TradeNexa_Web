"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  IndianRupee,
  Loader2,
  MessageSquare,
  Package,
} from "lucide-react";
import PortalBackLink from "@/components/portal/PortalBackLink";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import { Button } from "@/components/common/Button";
import ChatSidePanel from "@/components/chat/ChatSidePanel";
import InquiryStatusBadge from "@/components/inquiry/InquiryStatusBadge";
import InquiryQuotationDetails from "@/components/inquiry/InquiryQuotationDetails";
import {
  acceptInquiryQuotation,
  cancelInquiry,
  fetchInquiryById,
  getInquiryErrorMessage,
  rejectInquiryQuotation,
} from "@/services/inquiryService";
import {
  formatInquiryDate,
  inquiryCounterpartyLogo,
  inquiryCounterpartyName,
  inquiryProductTitle,
} from "@/utils/inquiryHelpers";
import { formatPrice, getInitials, resolveImageUrl } from "@/utils/catalogHelpers";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import type { ApiInquiry } from "@/types/inquiry";

function SnapshotStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
      className="flex items-start gap-2 rounded-lg bg-card/70 p-2.5 sm:bg-transparent sm:p-0"
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-muted-fg">{label}</p>
        <p className="truncate text-sm font-semibold text-foreground">{value}</p>
      </div>
    </motion.div>
  );
}

export default function BuyerProductInquiryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
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

  useEffect(() => {
    if (loading || !inquiry) return;
    if (searchParams.get("chat") !== "1") return;
    setChatOpen(true);
    router.replace(`/buyer/product-inquiries/${inquiry.id}`, { scroll: false });
  }, [loading, inquiry, searchParams, router]);

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
      const updated = await acceptInquiryQuotation(inquiry.quotation.id, inquiry.id);
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
      const updated = await rejectInquiryQuotation(inquiry.quotation.id, inquiry.id);
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
  const sellerLogo = inquiryCounterpartyLogo(inquiry, "buyer");
  const sellerLogoUrl = resolveImageUrl(sellerLogo);
  const quote = inquiry.quotation;
  const status = String(inquiry.status ?? "").toLowerCase();
  const quoteStatus = String(quote?.status ?? "").toUpperCase();
  const canCancelInquiry = status === "pending" && quoteStatus !== "ACCEPTED";

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 lg:px-8">
      <PortalBackLink href="/buyer/product-inquiries" />
      <PortalPageHeader
        title={title}
        subtitle={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{inquiry.inquiry_number || `Inquiry #${inquiry.id}`}</span>
            <span className="text-border" aria-hidden>
              ·
            </span>
            <Link
              href={`/buyer/product/${inquiry.product_id}`}
              className="font-medium text-primary hover:underline"
            >
              View product
            </Link>
          </span>
        }
        action={<InquiryStatusBadge status={inquiry.status} />}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="space-y-4 sm:space-y-5"
      >
        {/* Seller strip */}
        <div className="surface-card flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary-soft text-sm font-bold text-primary">
              {sellerLogoUrl ? (
                <Image
                  src={sellerLogoUrl}
                  alt=""
                  width={44}
                  height={44}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                getInitials(sellerName)
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground">{sellerName}</p>
              <p className="text-xs text-muted-fg">Inquiry sent to this seller</p>
            </div>
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

        {/* Snapshot band */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.06 } },
          }}
          className="grid grid-cols-2 gap-2.5 rounded-xl border border-primary/15 bg-primary-soft/40 p-3 sm:grid-cols-4 sm:gap-3 sm:p-4"
        >
          <SnapshotStat
            icon={Package}
            label="Quantity"
            value={`${inquiry.quantity} ${inquiry.unit || ""}`.trim()}
          />
          {inquiry.expected_price != null ? (
            <SnapshotStat
              icon={IndianRupee}
              label="Target price"
              value={formatPrice(inquiry.expected_price, inquiry.currency || "INR")}
            />
          ) : null}
          {inquiry.required_before ? (
            <SnapshotStat
              icon={Calendar}
              label="Required by"
              value={formatInquiryDate(inquiry.required_before)}
            />
          ) : null}
          <SnapshotStat
            icon={Clock}
            label="Submitted"
            value={formatInquiryDate(inquiry.created_at)}
          />
        </motion.div>

        {/* Message */}
        {inquiry.message ? (
          <div className="surface-card flex gap-3 p-4 sm:p-5">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-fg">
              <MessageSquare className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-fg">
                Your message
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">
                {inquiry.message}
              </p>
            </div>
          </div>
        ) : null}

        {/* Quotation — decision point */}
        <AnimatePresence>
          {quote ? (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="overflow-hidden rounded-xl border border-border border-l-4 border-l-primary bg-card shadow-[var(--shadow-card)]"
            >
              <div className="[&>div]:rounded-none [&>div]:border-0 [&>div]:bg-transparent">
                <InquiryQuotationDetails
                  quote={quote}
                  currency={inquiry.currency}
                  title="Seller's quotation"
                  showSeller
                  actions={
                    inquiry.status === "quoted" ? (
                      <div className="flex flex-wrap gap-2">
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
                    ) : null
                  }
                />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {canCancelInquiry ? (
          <div className="flex justify-end border-t border-border pt-4">
            <Button
              type="button"
              variant="secondary"
              loading={actionLoading}
              onClick={() => void handleCancel()}
            >
              Cancel inquiry
            </Button>
          </div>
        ) : null}
      </motion.div>

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
        otherPartyLogo={sellerLogo}
      />
    </div>
  );
}
