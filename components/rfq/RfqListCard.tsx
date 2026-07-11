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

  const hoverBorder = "hover:border-[#1565C0]/40";
  const hoverTitle = "group-hover:text-[#1565C0]";
  const ctaClass = "bg-[#1565C0] hover:bg-[#1255A8]";
  const unreadLabel =
    chatUnread > 0
      ? `${formatChatBadgeCount(chatUnread)} unread message${chatUnread === 1 ? "" : "s"}`
      : null;

  return (
    <article
      className={`group flex h-full flex-col rounded-2xl border border-[#E8ECF0] bg-white transition hover:shadow-md ${hoverBorder}`}
    >
      <Link
        href={href}
        aria-label={
          unreadLabel ? `${rfq.title}, ${unreadLabel}` : rfq.title
        }
        className="flex flex-1 cursor-pointer flex-col p-4 sm:p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className={`min-w-0 truncate text-base font-extrabold text-[#0D1B2A] sm:text-lg ${hoverTitle}`}>
                {rfq.title}
              </p>
              {isNew ? (
                <span className="shrink-0 rounded-full bg-[#1565C0] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  New
                </span>
              ) : null}
              {chatUnread > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F8EF] px-2 py-0.5 text-[10px] font-bold text-[#128C7E]">
                  <MessageSquare className="h-3 w-3" />
                  {formatChatBadgeCount(chatUnread)} unread
                </span>
              ) : null}
            </div>
            {isSeller && buyerSubtitle ? (
              <p className="mt-1 truncate text-xs font-semibold text-[#546E7A]">{buyerSubtitle}</p>
            ) : null}
            {rfq.category_name || rfq.subcategory_name ? (
              <p className="mt-1 truncate text-xs font-medium text-[#90A4AE]">
                {[rfq.category_name, rfq.subcategory_name].filter(Boolean).join(" · ")}
              </p>
            ) : null}
          </div>
          {showStatus ? <RfqStatusBadge status={rfq.status} className="shrink-0" /> : null}
        </div>

        {rfq.description ? (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[#546E7A]">{rfq.description}</p>
        ) : null}

        {isSeller ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {deadlineUrgency ? (
              <span
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${
                  deadlineUrgent
                    ? "bg-amber-50 text-amber-800"
                    : "bg-[#E3F2FD] text-[#1565C0]"
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                {deadlineUrgency}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#F4F6F9] px-2.5 py-1 text-xs font-bold text-[#546E7A]">
              <Users className="h-3.5 w-3.5" />
              {formatSellerCompetitionCount(rfq.quotations_count)}
            </span>
          </div>
        ) : null}

        {!isSeller ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${
                rfq.quotations_count && rfq.quotations_count > 0
                  ? "bg-[#E3F2FD] text-[#1565C0]"
                  : "bg-[#F4F6F9] text-[#90A4AE]"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              {formatRfqQuoteCount(rfq.quotations_count)}
            </span>
            {deadlineUrgency ? (
              <span
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${
                  deadlineUrgent ? "bg-amber-50 text-amber-800" : "bg-[#F4F6F9] text-[#546E7A]"
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                {deadlineUrgency}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-3 text-xs text-[#90A4AE]">
          {quantity ? (
            <span className="inline-flex items-center gap-1">
              <Package className="h-3.5 w-3.5 shrink-0" />
              {quantity}
            </span>
          ) : null}
          <span className="inline-flex min-w-0 items-center gap-1">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{location}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            {formatRfqDate(rfq.created_at)}
          </span>
        </div>
      </Link>

      <div className="border-t border-[#F0F2F5] px-4 pb-4 pt-3 sm:px-5">
        <Link
          href={href}
          className={`relative inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition active:scale-[0.98] ${ctaClass}`}
        >
          {isSeller ? "View & Quote" : "View RFQ & Quotes"}
          <ArrowRight className="h-4 w-4" />
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
