import type {
  ApiInquiry,
  ApiInquiryParty,
  ApiInquiryProduct,
  ApiInquiryQuotation,
  InquiryListResult,
  InquiryQuotationListResult,
  InquiryStatus,
} from "@/types/inquiry";
import type { ApiPagination } from "@/types/catalog";

function pickNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function pickString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  return null;
}

function pickBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  return null;
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

const INQUIRY_STATUSES: InquiryStatus[] = [
  "pending",
  "quoted",
  "rejected",
  "accepted",
  "cancelled",
  "closed",
];

function normalizeStatus(value: unknown): InquiryStatus {
  const raw = pickString(value)?.toLowerCase();
  if (raw && INQUIRY_STATUSES.includes(raw as InquiryStatus)) {
    return raw as InquiryStatus;
  }
  return "pending";
}

function normalizeParty(raw: unknown): ApiInquiryParty | null {
  const item = readRecord(raw);
  if (!item) return null;
  const id = pickNumber(item.id) ?? pickNumber(item.user_id);
  if (id == null) return null;
  return {
    id,
    full_name: pickString(item.full_name) ?? pickString(item.name),
    email: pickString(item.email),
    company_name: pickString(item.company_name) ?? pickString(item.company),
    company_logo: pickString(item.company_logo) ?? pickString(item.logo),
    profile_image: pickString(item.profile_image) ?? pickString(item.image),
  };
}

function normalizeProduct(raw: unknown): ApiInquiryProduct | null {
  const item = readRecord(raw);
  if (!item) return null;
  const id = pickNumber(item.id);
  if (id == null) return null;
  return {
    id,
    name: pickString(item.name),
    slug: pickString(item.slug),
    thumbnail: pickString(item.thumbnail) ?? pickString(item.image),
    price: pickNumber(item.price),
    currency: pickString(item.currency) ?? "INR",
    unit: pickString(item.unit),
    moq: pickNumber(item.moq) ?? pickNumber(item.minimum_order_quantity),
  };
}

export function normalizeInquiryQuotation(raw: unknown): ApiInquiryQuotation | null {
  const item = readRecord(raw);
  if (!item) return null;
  const id = pickNumber(item.id);
  if (id == null) return null;
  return {
    id,
    quotation_number: pickString(item.quotation_number),
    inquiry_id: pickNumber(item.inquiry_id),
    seller_id: pickNumber(item.seller_id),
    price: pickNumber(item.price),
    quantity: pickNumber(item.quantity),
    unit: pickString(item.unit),
    gst_percentage: pickNumber(item.gst_percentage),
    gst_amount: pickNumber(item.gst_amount),
    transportation_charge: pickNumber(item.transportation_charge),
    total_amount: pickNumber(item.total_amount),
    delivery_days: pickNumber(item.delivery_days),
    payment_terms: pickString(item.payment_terms),
    validity_days: pickNumber(item.validity_days),
    remarks: pickString(item.remarks),
    attachment: pickString(item.attachment),
    status: pickString(item.status),
    seller_name: pickString(item.seller_name),
    company_name: pickString(item.company_name),
    inquiry_number: pickString(item.inquiry_number),
    inquiry_status: pickString(item.inquiry_status)
      ? normalizeStatus(item.inquiry_status)
      : null,
    product_id: pickNumber(item.product_id),
    created_at: pickString(item.created_at),
    updated_at: pickString(item.updated_at),
  };
}

export function normalizeInquiry(raw: unknown): ApiInquiry | null {
  const item = readRecord(raw);
  if (!item) return null;
  const id = pickNumber(item.id);
  const productId =
    pickNumber(item.product_id) ??
    pickNumber(readRecord(item.product)?.id);
  const quantity = pickNumber(item.quantity);
  if (id == null || productId == null || quantity == null) return null;

  return {
    id,
    inquiry_number: pickString(item.inquiry_number),
    product_id: productId,
    product: normalizeProduct(item.product),
    buyer: normalizeParty(item.buyer),
    seller: normalizeParty(item.seller),
    buyer_id: pickNumber(item.buyer_id) ?? normalizeParty(item.buyer)?.id ?? null,
    seller_id: pickNumber(item.seller_id) ?? normalizeParty(item.seller)?.id ?? null,
    quantity,
    unit: pickString(item.unit),
    message: pickString(item.message),
    expected_price: pickNumber(item.expected_price),
    currency: pickString(item.currency) ?? "INR",
    required_before: pickString(item.required_before),
    status: normalizeStatus(item.status),
    reject_reason: pickString(item.reject_reason) ?? pickString(item.reason),
    viewed_at: pickString(item.viewed_at),
    responded_at: pickString(item.responded_at),
    is_active: pickBoolean(item.is_active),
    conversation_id:
      pickNumber(item.conversation_id) ??
      pickNumber(readRecord(item.conversation)?.id) ??
      pickNumber(readRecord(item.conversation)?.conversation_id),
    quotation: normalizeInquiryQuotation(item.quotation),
    created_at: pickString(item.created_at),
    updated_at: pickString(item.updated_at),
  };
}

export function unwrapInquiryPaginated(
  payload: unknown,
  normalize: (item: unknown) => ApiInquiry | null,
  page = 1,
  limit = 10
): InquiryListResult {
  return unwrapPaginated(payload, normalize, page, limit);
}

export function unwrapInquiryQuotationPaginated(
  payload: unknown,
  page = 1,
  limit = 10
): InquiryQuotationListResult {
  return unwrapPaginated(payload, normalizeInquiryQuotation, page, limit);
}

function unwrapPaginated<T>(
  payload: unknown,
  normalize: (item: unknown) => T | null,
  page = 1,
  limit = 10
): { results: T[]; pagination: ApiPagination } {
  const record = readRecord(payload);
  const list =
    (Array.isArray(payload) && payload) ||
    (Array.isArray(record?.results) && record.results) ||
    (Array.isArray(record?.data) && record.data) ||
    (Array.isArray(record?.inquiries) && record.inquiries) ||
    (Array.isArray(record?.quotations) && record.quotations) ||
    [];

  const results = list.map(normalize).filter((item): item is T => item !== null);
  const paginationSource = readRecord(record?.pagination) ?? record ?? {};
  const pageLimit = pickNumber(paginationSource.limit) ?? limit;
  const total = pickNumber(paginationSource.total) ?? results.length;
  const currentPage = pickNumber(paginationSource.page) ?? page;
  const totalPages =
    pickNumber(paginationSource.totalPages) ??
    pickNumber(paginationSource.total_pages) ??
    (pageLimit > 0 ? Math.max(1, Math.ceil(total / pageLimit)) : 1);

  return {
    results,
    pagination: {
      total,
      page: currentPage,
      limit: pageLimit,
      totalPages,
    },
  };
}

export const INQUIRY_STATUS_TABS = [
  "all",
  "pending",
  "quoted",
  "accepted",
  "rejected",
  "cancelled",
  "closed",
] as const;

export type InquiryStatusTab = (typeof INQUIRY_STATUS_TABS)[number];

export function inquiryTabToApiStatus(tab: InquiryStatusTab): InquiryStatus | undefined {
  if (tab === "all") return undefined;
  return tab;
}

export function formatInquiryStatusLabel(status: string): string {
  const normalized = status.trim().toLowerCase();
  if (!normalized) return "Unknown";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function formatInquiryDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function inquiryProductTitle(inquiry: ApiInquiry): string {
  return (
    inquiry.product?.name?.trim() ||
    `Product #${inquiry.product_id}`
  );
}

export function inquiryCounterpartyName(
  inquiry: ApiInquiry,
  role: "buyer" | "seller"
): string {
  const party = role === "buyer" ? inquiry.seller : inquiry.buyer;
  return (
    party?.company_name?.trim() ||
    party?.full_name?.trim() ||
    (role === "buyer" ? "Seller" : "Buyer")
  );
}
