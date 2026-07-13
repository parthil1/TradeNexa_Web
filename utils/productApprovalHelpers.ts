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
  return isProductApprovalStatus(value) ? value : null;
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
      return "bg-amber-50 text-amber-800 ring-1 ring-amber-200";
    case "revision_required":
      return "bg-orange-50 text-orange-800 ring-1 ring-orange-200";
    case "approved":
      return "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200";
    case "rejected":
      return "bg-red-50 text-red-700 ring-1 ring-red-200";
    default:
      return "bg-muted text-muted-fg ring-1 ring-border";
  }
}

export function canSellerEditProduct(status?: string | null): boolean {
  return status !== "rejected";
}

export function canSellerSubmitForReview(status?: string | null): boolean {
  return status === "revision_required";
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
      return "Admin requested changes. Edit the product, then submit for review.";
    case "approved":
      return "Live for buyers when Active. Material edits will send it back to review.";
    case "rejected":
      return "Permanently rejected. This listing cannot be edited or resubmitted.";
    default:
      return null;
  }
}
