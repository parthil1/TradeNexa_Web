"use client";

import {
  approvalStatusClass,
  formatApprovalStatus,
} from "@/utils/productApprovalHelpers";

interface ProductApprovalBadgeProps {
  status?: string | null;
  className?: string;
}

export default function ProductApprovalBadge({
  status,
  className = "",
}: ProductApprovalBadgeProps) {
  if (!status) return null;

  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${approvalStatusClass(status)} ${className}`}
    >
      {formatApprovalStatus(status)}
    </span>
  );
}
