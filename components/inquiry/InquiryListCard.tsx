"use client";

import Link from "next/link";
import { ArrowRight, Calendar, MessageSquare, Package } from "lucide-react";
import InquiryStatusBadge from "@/components/inquiry/InquiryStatusBadge";
import type { ApiInquiry } from "@/types/inquiry";
import {
  formatInquiryDate,
  inquiryCounterpartyName,
  inquiryProductTitle,
} from "@/utils/inquiryHelpers";
import { formatPrice, resolveImageUrl } from "@/utils/catalogHelpers";
import Image from "next/image";

interface InquiryListCardProps {
  inquiry: ApiInquiry;
  href: string;
  variant?: "buyer" | "seller";
}

export default function InquiryListCard({
  inquiry,
  href,
  variant = "buyer",
}: InquiryListCardProps) {
  const title = inquiryProductTitle(inquiry);
  const party = inquiryCounterpartyName(inquiry, variant);
  const thumb = resolveImageUrl(inquiry.product?.thumbnail);
  const qtyLabel = `${inquiry.quantity} ${inquiry.unit || inquiry.product?.unit || ""}`.trim();

  return (
    <article className="group surface-card-hover flex h-full flex-col overflow-hidden">
      <Link
        href={href}
        aria-label={`${title} inquiry`}
        className="flex flex-1 cursor-pointer flex-col p-4 sm:p-5"
      >
        <div className="flex items-start gap-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted">
            {thumb ? (
              <Image src={thumb} alt="" fill className="object-cover" unoptimized />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-muted-fg">
                <Package className="h-5 w-5" />
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="min-w-0 truncate text-base font-semibold text-foreground transition-colors duration-200 group-hover:text-primary">
                {title}
              </p>
              <InquiryStatusBadge status={inquiry.status} className="shrink-0" />
            </div>
            <p className="mt-1 truncate text-xs font-medium text-muted-fg">{party}</p>
            {inquiry.inquiry_number ? (
              <p className="mt-0.5 text-[11px] text-muted-fg">{inquiry.inquiry_number}</p>
            ) : null}
          </div>
        </div>

        {inquiry.message ? (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-fg">
            {inquiry.message}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-fg">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 font-semibold text-foreground">
            <Package className="h-3.5 w-3.5" aria-hidden />
            {qtyLabel}
          </span>
          {inquiry.expected_price != null ? (
            <span className="inline-flex items-center rounded-lg bg-primary-soft px-2.5 py-1 font-semibold text-primary">
              Target {formatPrice(inquiry.expected_price, inquiry.currency || "INR")}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 font-medium">
            <Calendar className="h-3.5 w-3.5" aria-hidden />
            {formatInquiryDate(inquiry.created_at)}
          </span>
          {inquiry.conversation_id ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-success-soft px-2.5 py-1 font-semibold text-whatsapp-dark">
              <MessageSquare className="h-3.5 w-3.5" aria-hidden />
              Chat ready
            </span>
          ) : null}
        </div>

        <div className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary">
          View inquiry
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </div>
      </Link>
    </article>
  );
}
