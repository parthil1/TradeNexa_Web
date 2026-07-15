"use client";

import React from "react";
import type { InquiryQuotationStatus } from "@/types/inquiry";
import { formatInquiryQuotationStatusLabel } from "@/utils/inquiryHelpers";

const STATUS_CLASS: Record<string, string> = {
  submitted: "bg-primary-soft text-primary",
  updated: "bg-primary-soft text-primary",
  accepted: "bg-success-soft text-success",
  rejected: "bg-error-soft text-error",
  withdrawn: "bg-muted text-muted-fg",
};

export default function InquiryQuotationStatusBadge({
  status,
  className = "",
}: {
  status?: InquiryQuotationStatus | string | null;
  className?: string;
}) {
  if (!status) return null;
  const key = String(status).trim().toLowerCase().replace(/[\s_]+/g, "");
  const tone = STATUS_CLASS[key] ?? "bg-muted text-muted-fg";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tone} ${className}`}
    >
      {formatInquiryQuotationStatusLabel(status)}
    </span>
  );
}
