"use client";

import Link from "next/link";
import { ArrowRight, Calendar, Clock, MapPin, MessageSquare, Package, Users } from "lucide-react";
import ConversationBadge, {
  formatChatBadgeCount,
  useRfqChatUnread,
} from "@/components/chat/ConversationBadge";
import type { ApiRfqListItem } from "@/types/rfq";
import {
  formatRfqDate,
  formatRfqDeadlineUrgency,
  formatRfqLocation,
  formatRfqQuantity,
  formatRfqQuoteCount,
  formatSellerCompetitionCount,
  isRfqDeadlineUrgent,
  isRfqRecentlyPosted,
  shouldShowRfqStatusBadge,
} from "@/utils/rfqHelpers";
import RfqStatusBadge from "@/components/rfq/RfqStatusBadge";

interface RfqListCardProps {
  rfq: ApiRfqListItem;
  href: string;
  variant?: "buyer" | "seller";
  meta?: string;
}

export default function RfqListCard({ rfq, href, variant = "buyer", meta }: RfqListCardProps) {
  const isSeller = variant === "seller";
  const chatUnread = useRfqChatUnread(rfq.id);
  const quantity = formatRfqQuantity(rfq);
  const location = formatRfqLocation(rfq);
  const deadlineUrgency = formatRfqDeadlineUrgency(rfq.quotation_deadline);
  const deadlineUrgent = isRfqDeadlineUrgent(rfq.quotation_deadline);
  const showStatus = shouldShowRfqStatusBadge(rfq.status, variant);
  const isNew = isSeller && isRfqRecentlyPosted(rfq.created_at);

  const buyerSubtitle =
    meta ??
    (isSeller
      ? rfq.buyer_company?.trim() || null
      : [rfq.buyer_company, rfq.buyer_name].filter(Boolean).join(" · ") || null);

  const unreadLabel =
    chatUnread > 0
      ? `${formatChatBadgeCount(chatUnread)} unread message${chatUnread === 1 ? "" : "s"}`
      : null;

  return (
    <article className="group surface-card-hover flex h-full flex-col overflow-hidden">
      <Link
        href={href}
        aria-label={unreadLabel ? `${rfq.title}, ${unreadLabel}` : rfq.title}
        className="flex flex-1 cursor-pointer flex-col p-4 sm:p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="min-w-0 truncate text-base font-semibold text-foreground transition-colors duration-200 group-hover:text-primary sm:text-lg">
                {rfq.title}
              </p>
              {isNew ? (
                <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  New
                </span>
              ) : null}
              {chatUnread > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-whatsapp-dark">
                  <MessageSquare className="h-3 w-3" aria-hidden />
                  {formatChatBadgeCount(chatUnread)} unread
                </span>
              ) : null}
            </div>
            {isSeller && buyerSubtitle ? (
              <p className="mt-1 truncate text-xs font-medium text-muted-fg">{buyerSubtitle}</p>
            ) : null}
            {rfq.category_name || rfq.subcategory_name ? (
              <p className="mt-1 truncate text-xs font-medium text-muted-placeholder">
                {[rfq.category_name, rfq.subcategory_name].filter(Boolean).join(" · ")}
              </p>
            ) : null}
          </div>
          {showStatus ? <RfqStatusBadge status={rfq.status} className="shrink-0" /> : null}
        </div>

        {rfq.description ? (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-fg">{rfq.description}</p>
        ) : null}

        {isSeller ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {deadlineUrgency ? (
              <span
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                  deadlineUrgent ? "bg-amber-50 text-amber-800" : "bg-primary-soft text-primary"
                }`}
              >
                <Clock className="h-3.5 w-3.5" aria-hidden />
                {deadlineUrgency}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 text-xs font-semibold text-muted-fg">
              <Users className="h-3.5 w-3.5" aria-hidden />
              {formatSellerCompetitionCount(rfq.quotations_count)}
            </span>
          </div>
        ) : null}

        {!isSeller ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                rfq.quotations_count && rfq.quotations_count > 0
                  ? "bg-primary-soft text-primary"
                  : "bg-muted text-muted-placeholder"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" aria-hidden />
              {formatRfqQuoteCount(rfq.quotations_count)}
            </span>
            {deadlineUrgency ? (
              <span
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                  deadlineUrgent ? "bg-amber-50 text-amber-800" : "bg-muted text-muted-fg"
                }`}
              >
                <Clock className="h-3.5 w-3.5" aria-hidden />
                {deadlineUrgency}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-3 text-xs text-muted-placeholder">
          {quantity ? (
            <span className="inline-flex items-center gap-1">
              <Package className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {quantity}
            </span>
          ) : null}
          <span className="inline-flex min-w-0 items-center gap-1">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">{location}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {formatRfqDate(rfq.created_at)}
          </span>
        </div>
      </Link>

      <div className="border-t border-border px-4 pb-4 pt-3 sm:px-5">
        <Link
          href={href}
          className="relative inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-button)] transition-all duration-200 hover:bg-primary-hover active:scale-[0.98]"
        >
          {isSeller ? "View & Quote" : "View RFQ & Quotes"}
          <ArrowRight className="h-4 w-4" aria-hidden />
          {chatUnread > 0 ? (
            <ConversationBadge
              count={chatUnread}
              size="md"
              className="absolute -right-1.5 -top-1.5 ring-2 ring-white"
            />
          ) : null}
        </Link>
      </div>
    </article>
  );
}
