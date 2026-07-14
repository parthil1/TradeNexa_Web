import type { ProductApprovalStatus } from "@/types/product";

export const PRODUCT_APPROVAL_STATUSES: ProductApprovalStatus[] = [
  "in_review",
  "revision_required",
  "approved",
  "rejected",
];

export const SELLER_PRODUCT_APPROVAL_TABS = [
  "all",
  "in_review",
  "revision_required",
  "approved",
  "rejected",
] as const;

export type SellerProductApprovalTab = (typeof SELLER_PRODUCT_APPROVAL_TABS)[number];

export function isProductApprovalStatus(value: unknown): value is ProductApprovalStatus {
  return (
    typeof value === "string" &&
    (PRODUCT_APPROVAL_STATUSES as string[]).includes(value)
  );
}

export function parseApprovalStatus(value: unknown): ProductApprovalStatus | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");
  return isProductApprovalStatus(normalized) ? normalized : null;
}

/** Pull approval status from common API response shapes. */
export function extractApprovalStatus(raw: Record<string, unknown> | null | undefined): ProductApprovalStatus | null {
  if (!raw) return null;

  const marketplace =
    raw.marketplace && typeof raw.marketplace === "object"
      ? (raw.marketplace as Record<string, unknown>)
      : null;
  const approval =
    raw.approval && typeof raw.approval === "object"
      ? (raw.approval as Record<string, unknown>)
      : null;
  const moderation =
    raw.moderation && typeof raw.moderation === "object"
      ? (raw.moderation as Record<string, unknown>)
      : null;

  const candidates = [
    raw.approval_status,
    raw.approvalStatus,
    marketplace?.approval_status,
    approval?.status,
    approval?.approval_status,
    moderation?.status,
    moderation?.approval_status,
    raw.status,
  ];

  for (const candidate of candidates) {
    const parsed = parseApprovalStatus(candidate);
    if (parsed) return parsed;
  }
  return null;
}

export function formatApprovalStatus(status?: string | null): string {
  switch (status) {
    case "in_review":
      return "In review";
    case "revision_required":
      return "Revision required";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    default:
      return "Unknown";
  }
}

export function formatApprovalStatusTabLabel(tab: string): string {
  if (tab === "all") return "All";
  return formatApprovalStatus(tab);
}

export function approvalStatusClass(status?: string | null): string {
  switch (status) {
    case "in_review":
      return "bg-warning-soft text-warning ring-1 ring-warning/25";
    case "revision_required":
      return "bg-warning-soft text-warning ring-1 ring-warning/30";
    case "approved":
      return "bg-success-soft text-success ring-1 ring-success/25";
    case "rejected":
      return "bg-error-soft text-error ring-1 ring-error/25";
    default:
      return "bg-muted text-muted-fg ring-1 ring-border";
  }
}

export function canSellerEditProduct(status?: string | null): boolean {
  return parseApprovalStatus(status) !== "rejected";
}

export function approvalTabToApiStatus(
  tab: SellerProductApprovalTab
): ProductApprovalStatus | undefined {
  return tab === "all" ? undefined : tab;
}

export function approvalStatusHint(status?: string | null): string | null {
  switch (status) {
    case "in_review":
      return "Waiting for admin moderation. Buyers cannot see this listing yet.";
    case "revision_required":
      return "Admin requested changes. Edit and save the product to continue.";
    case "approved":
      return "Live for buyers when Active. Material edits will send it back to review.";
    case "rejected":
      return "Permanently rejected. This listing cannot be edited or resubmitted.";
    default:
      return null;
  }
}
