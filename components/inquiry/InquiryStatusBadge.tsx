"use client";

import React from "react";
import type { InquiryStatus } from "@/types/inquiry";
import { formatInquiryStatusLabel } from "@/utils/inquiryHelpers";

const STATUS_CLASS: Record<string, string> = {
  pending: "bg-warning-soft text-warning",
  quoted: "bg-primary-soft text-primary",
  accepted: "bg-success-soft text-success",
  rejected: "bg-error-soft text-error",
  cancelled: "bg-muted text-muted-fg",
  closed: "bg-muted text-muted-fg",
};

export default function InquiryStatusBadge({
  status,
  className = "",
}: {
  status: InquiryStatus | string;
  className?: string;
}) {
  const key = String(status).toLowerCase();
  const tone = STATUS_CLASS[key] ?? "bg-muted text-muted-fg";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tone} ${className}`}
    >
      {formatInquiryStatusLabel(status)}
    </span>
  );
}
