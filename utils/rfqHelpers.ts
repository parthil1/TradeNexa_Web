import type { ApiPagination, PaginatedResult } from "@/types/catalog";
import type { ApiQuotation, ApiRfqDetail, ApiRfqListItem, QuotationStatus, RfqStatus } from "@/types/rfq";
import { unwrapPaginatedResult } from "@/utils/catalogHelpers";

function pickString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  return null;
}

function pickNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

export function normalizeRfqListItem(raw: unknown): ApiRfqListItem | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const id = pickNumber(item.id);
  const title = pickString(item.title);
  if (id == null || !title) return null;

  const category = readRecord(item.category);
  const subcategory = readRecord(item.subcategory);
  const product = readRecord(item.product);
  const buyer = readRecord(item.buyer);
  const company = readRecord(item.company);

  return {
    id,
    title,
    description: pickString(item.description),
    status: pickString(item.status) as RfqStatus | null,
    visibility: pickString(item.visibility),
    quantity: pickNumber(item.quantity),
    unit: pickString(item.unit),
    category_id: pickNumber(item.category_id) ?? pickNumber(category?.id),
    subcategory_id: pickNumber(item.subcategory_id) ?? pickNumber(subcategory?.id),
    category_name:
      pickString(item.category_name) ??
      pickString(category?.name) ??
      (typeof item.category === "string" ? pickString(item.category) : null),
    subcategory_name: pickString(item.subcategory_name) ?? pickString(subcategory?.name),
    city: pickString(item.city) ?? pickString(buyer?.city),
    state: pickString(item.state) ?? pickString(buyer?.state),
    country: pickString(item.country),
    quotation_deadline: pickString(item.quotation_deadline),
    required_before: pickString(item.required_before),
    expected_price: pickNumber(item.expected_price),
    budget: pickNumber(item.budget),
    currency: pickString(item.currency) ?? "INR",
    quotations_count:
      pickNumber(item.quotations_count) ??
      pickNumber(item.quotation_count) ??
      pickNumber(item.quotes_count),
    created_at: pickString(item.created_at),
    updated_at: pickString(item.updated_at),
    buyer_name: pickString(item.buyer_name) ?? pickString(buyer?.name) ?? pickString(buyer?.full_name),
    buyer_company:
      pickString(item.buyer_company) ??
      pickString(item.company_name) ??
      pickString(item.buyer_company_name) ??
      pickString(company?.company_name) ??
      pickString(company?.name) ??
      pickString(buyer?.company_name) ??
      pickString(buyer?.company) ??
      pickString(buyer?.business_name),
    product_id: pickNumber(item.product_id) ?? pickNumber(product?.id),
    product_name: pickString(item.product_name) ?? pickString(product?.name),
  };
}

export function normalizeRfqDetail(raw: unknown): ApiRfqDetail | null {
  const base = normalizeRfqListItem(raw);
  if (!base) return null;
  const item = raw as Record<string, unknown>;
  const category = readRecord(item.category);
  const subcategory = readRecord(item.subcategory);
  const product = readRecord(item.product);
  const buyer = readRecord(item.buyer);
  const company = readRecord(item.company);

  return {
    ...base,
    address_line_1: pickString(item.address_line_1),
    address_line_2: pickString(item.address_line_2),
    pincode: pickString(item.pincode),
    payment_terms: pickString(item.payment_terms),
    product: product?.id
      ? {
          id: pickNumber(product.id) ?? 0,
          name: pickString(product.name) ?? undefined,
          slug: pickString(product.slug) ?? undefined,
        }
      : base.product_id
        ? { id: base.product_id, name: base.product_name ?? undefined }
        : null,
    category: category?.id
      ? { id: pickNumber(category.id) ?? 0, name: pickString(category.name) ?? undefined }
      : base.category_id
        ? { id: base.category_id, name: base.category_name ?? undefined }
        : null,
    subcategory: subcategory?.id
      ? { id: pickNumber(subcategory.id) ?? 0, name: pickString(subcategory.name) ?? undefined }
      : base.subcategory_id
        ? { id: base.subcategory_id, name: base.subcategory_name ?? undefined }
        : null,
    buyer:
      buyer || company || base.buyer_name || base.buyer_company
        ? {
            name:
              pickString(buyer?.name) ??
              pickString(buyer?.full_name) ??
              base.buyer_name ??
              undefined,
            company_name:
              pickString(buyer?.company_name) ??
              pickString(buyer?.company) ??
              pickString(company?.company_name) ??
              pickString(company?.name) ??
              base.buyer_company ??
              undefined,
            city: pickString(buyer?.city) ?? undefined,
            state: pickString(buyer?.state) ?? undefined,
          }
        : null,
    my_quotation:
      normalizeQuotation(item.my_quotation) ??
      normalizeQuotation(item.seller_quotation) ??
      normalizeQuotation(item.quotation),
  };
}

export function normalizeQuotation(raw: unknown): ApiQuotation | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const id = pickNumber(item.id);
  if (id == null) return null;

  const seller = readRecord(item.seller);
  const rfq = readRecord(item.rfq);
  const buyer = readRecord(item.buyer) ?? readRecord(rfq?.buyer);
  const product = readRecord(item.product) ?? readRecord(rfq?.product);

  return {
    id,
    rfq_id: pickNumber(item.rfq_id) ?? pickNumber(rfq?.id),
    rfq_status:
      pickString(item.rfq_status) ??
      pickString(rfq?.status),
    status: pickString(item.status) as QuotationStatus | null,
    price: pickNumber(item.price),
    quantity: pickNumber(item.quantity),
    unit: pickString(item.unit),
    gst_percentage: pickNumber(item.gst_percentage),
    transportation_charge: pickNumber(item.transportation_charge),
    delivery_days: pickNumber(item.delivery_days),
    payment_terms: pickString(item.payment_terms),
    validity_days: pickNumber(item.validity_days),
    remarks: pickString(item.remarks),
    revision_request_remarks:
      pickString(item.revision_request_remarks) ??
      pickString(item.revision_remarks) ??
      pickString(item.buyer_remarks) ??
      pickString(item.request_revision_remarks) ??
      pickString(item.negotiation_remarks) ??
      pickString(readRecord(item.revision_request)?.remarks) ??
      pickString(readRecord(item.last_revision_request)?.remarks) ??
      pickString(readRecord(item.latest_revision_request)?.remarks),
    currency: pickString(item.currency) ?? "INR",
    total_amount: pickNumber(item.total_amount) ?? pickNumber(item.total),
    seller_name: pickString(item.seller_name) ?? pickString(seller?.name),
    seller_company:
      pickString(item.seller_company) ?? pickString(seller?.company_name) ?? pickString(seller?.company),
    seller_id:
      pickNumber(item.seller_id) ??
      pickNumber(item.seller_user_id) ??
      pickNumber(item.user_id) ??
      pickNumber(seller?.id) ??
      pickNumber(seller?.user_id) ??
      pickNumber(seller?.seller_id) ??
      pickNumber(seller?.seller_user_id),
    buyer_name:
      pickString(item.buyer_name) ??
      pickString(buyer?.name) ??
      pickString(rfq?.buyer_name),
    buyer_company:
      pickString(item.buyer_company) ??
      pickString(buyer?.company_name) ??
      pickString(buyer?.company) ??
      pickString(rfq?.buyer_company),
    rfq_title:
      pickString(item.rfq_title) ??
      pickString(rfq?.title) ??
      pickString(item.title),
    product_name:
      pickString(item.product_name) ??
      pickString(rfq?.product_name) ??
      pickString(product?.name),
    created_at: pickString(item.created_at),
    updated_at: pickString(item.updated_at),
  };
}

export function unwrapRfqPaginated<T>(
  payload: unknown,
  normalize: (item: unknown) => T | null,
  page = 1,
  limit = 10
): PaginatedResult<T> {
  const paginated = unwrapPaginatedResult<unknown>(payload);
  const results = paginated.results.map(normalize).filter((item): item is T => item !== null);

  const total = paginated.pagination.total > 0 ? paginated.pagination.total : results.length;

  return {
    results,
    pagination: {
      ...paginated.pagination,
      total,
      page: paginated.pagination.page || page,
      limit: paginated.pagination.limit || limit,
      totalPages:
        paginated.pagination.totalPages > 0
          ? paginated.pagination.totalPages
          : total > 0
            ? Math.max(1, Math.ceil(total / (paginated.pagination.limit || limit)))
            : 0,
    },
  };
}

/** Normalize buyer/seller quotation list payloads (array or paginated object). */
export function mapQuotationListResult(
  payload: unknown,
  page = 1,
  limit = 10
): PaginatedResult<ApiQuotation> {
  const pageSize = limit > 0 ? limit : 10;
  const currentPage = page > 0 ? page : 1;

  const paginateLocally = (all: ApiQuotation[], totalOverride?: number): PaginatedResult<ApiQuotation> => {
    const total = totalOverride != null && totalOverride > 0 ? totalOverride : all.length;
    const start = (currentPage - 1) * pageSize;
    return {
      results: all.slice(start, start + pageSize),
      pagination: {
        total,
        page: currentPage,
        limit: pageSize,
        totalPages: total > 0 ? Math.ceil(total / pageSize) : 0,
      },
    };
  };

  const pickList = (value: unknown): unknown[] | null =>
    Array.isArray(value) ? value : null;

  if (Array.isArray(payload)) {
    const all = payload.map(normalizeQuotation).filter((item): item is ApiQuotation => item !== null);
    return paginateLocally(all);
  }

  if (!payload || typeof payload !== "object") {
    return paginateLocally([]);
  }

  const record = payload as Record<string, unknown>;
  const nestedList =
    pickList(record.quotations) ??
    pickList(record.items) ??
    pickList(record.data) ??
    pickList(record.results);

  const meta =
    (record.pagination && typeof record.pagination === "object"
      ? (record.pagination as Record<string, unknown>)
      : null) ??
    (record.meta && typeof record.meta === "object"
      ? (record.meta as Record<string, unknown>)
      : null);

  const metaTotal =
    pickNumber(meta?.total) ??
    pickNumber(meta?.count) ??
    pickNumber(record.total) ??
    pickNumber(record.count);
  const metaPage =
    pickNumber(meta?.page) ??
    pickNumber(meta?.current_page) ??
    pickNumber(record.page) ??
    currentPage;
  const metaLimit =
    pickNumber(meta?.limit) ??
    pickNumber(meta?.per_page) ??
    pickNumber(meta?.page_size) ??
    pickNumber(record.limit) ??
    pageSize;
  const metaTotalPages =
    pickNumber(meta?.totalPages) ??
    pickNumber(meta?.total_pages) ??
    pickNumber(record.totalPages) ??
    pickNumber(record.total_pages);

  if (nestedList) {
    const all = nestedList
      .map(normalizeQuotation)
      .filter((item): item is ApiQuotation => item !== null);

    // Server already returned a single page (count <= limit) with total metadata.
    const serverPaged =
      metaTotal != null &&
      metaTotal > all.length &&
      all.length <= pageSize;

    if (serverPaged) {
      const total = metaTotal;
      const totalPages =
        metaTotalPages != null && metaTotalPages > 0
          ? metaTotalPages
          : Math.ceil(total / (metaLimit || pageSize));
      return {
        results: all,
        pagination: {
          total,
          page: metaPage || currentPage,
          limit: metaLimit || pageSize,
          totalPages,
        },
      };
    }

    // Full list (or no usable server paging) — slice on the client.
    return paginateLocally(all, metaTotal ?? all.length);
  }

  const unwrapped = unwrapRfqPaginated(payload, normalizeQuotation, currentPage, pageSize);
  if (
    unwrapped.results.length > pageSize ||
    (unwrapped.pagination.totalPages <= 1 &&
      unwrapped.pagination.total > pageSize &&
      unwrapped.results.length > pageSize)
  ) {
    return paginateLocally(unwrapped.results, unwrapped.pagination.total);
  }

  return {
    results: unwrapped.results,
    pagination: {
      total: unwrapped.pagination.total || unwrapped.results.length,
      page: unwrapped.pagination.page || currentPage,
      limit: unwrapped.pagination.limit || pageSize,
      totalPages:
        unwrapped.pagination.totalPages > 0
          ? unwrapped.pagination.totalPages
          : unwrapped.results.length > 0
            ? Math.max(
                1,
                Math.ceil(
                  (unwrapped.pagination.total || unwrapped.results.length) / pageSize
                )
              )
            : 0,
    },
  };
}

export function formatRfqStatus(status?: string | null): string {
  if (!status) return "Unknown";
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function rfqStatusClass(status?: string | null): string {
  const value = (status ?? "").toUpperCase();
  if (value.includes("DRAFT")) return "bg-slate-100 text-slate-600";
  if (value.includes("PUBLISH") || value.includes("OPEN")) return "bg-emerald-50 text-emerald-700";
  if (value.includes("CLOSE")) return "bg-violet-50 text-violet-700";
  if (value.includes("CANCEL")) return "bg-red-50 text-red-600";
  if (value.includes("EXPIRE")) return "bg-slate-200 text-slate-700";
  return "bg-blue-50 text-blue-700";
}

export function quotationStatusClass(status?: string | null): string {
  const value = (status ?? "").toUpperCase();
  if (value.includes("ACCEPT")) return "bg-emerald-50 text-emerald-700";
  if (value.includes("REJECT") || value.includes("WITHDRAW")) return "bg-red-50 text-red-600";
  if (value.includes("REVISION") || value.includes("NEGOTIAT")) return "bg-amber-50 text-amber-700";
  if (value.includes("PENDING") || value.includes("SUBMIT")) return "bg-blue-50 text-blue-700";
  return "bg-slate-100 text-slate-600";
}

export function formatRfqLocation(rfq: Pick<ApiRfqListItem, "city" | "state" | "country">): string {
  return [rfq.city, rfq.state, rfq.country].filter(Boolean).join(", ") || "India";
}

const CATEGORY_ACCENTS = [
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700",
  "bg-orange-100 text-orange-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
] as const;

export function getRfqCategoryAccent(label?: string | null): string {
  const text = (label ?? "R").trim();
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash + text.charCodeAt(i)) % CATEGORY_ACCENTS.length;
  }
  return CATEGORY_ACCENTS[hash] ?? CATEGORY_ACCENTS[0];
}

export function getRfqCategoryInitial(rfq: Pick<ApiRfqListItem, "category_name" | "title">): string {
  const source = rfq.category_name?.trim() || rfq.title?.trim() || "R";
  return source.charAt(0).toUpperCase();
}

/** Stable initials from buyer company or contact name (seller feed avatars). */
export function getBuyerInitials(rfq: Pick<ApiRfqListItem, "buyer_company" | "buyer_name">): string {
  const source = rfq.buyer_company?.trim() || rfq.buyer_name?.trim() || "?";
  const words = source.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function getBuyerAccent(rfq: Pick<ApiRfqListItem, "buyer_company" | "buyer_name">): string {
  const label = rfq.buyer_company?.trim() || rfq.buyer_name?.trim() || "Buyer";
  return getRfqCategoryAccent(label);
}

export function formatRfqDeadlineUrgency(deadline?: string | null): string | null {
  if (!deadline) return null;
  const end = new Date(deadline);
  if (Number.isNaN(end.getTime())) return null;

  const diffDays = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "Deadline passed";
  if (diffDays === 0) return "Closes today";
  if (diffDays === 1) return "Closes tomorrow";
  return `Closes in ${diffDays} days`;
}

export function isRfqDeadlineUrgent(deadline?: string | null): boolean {
  if (!deadline) return false;
  const end = new Date(deadline);
  if (Number.isNaN(end.getTime())) return false;
  const diffDays = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 3;
}

export function formatSellerCompetitionCount(count?: number | null): string {
  if (count == null || count <= 0) return "Be the first to quote";
  return `${count} quote${count === 1 ? "" : "s"} submitted`;
}

export function isRfqPostedToday(createdAt?: string | null): boolean {
  if (!createdAt) return false;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return false;
  const now = new Date();
  return (
    created.getFullYear() === now.getFullYear() &&
    created.getMonth() === now.getMonth() &&
    created.getDate() === now.getDate()
  );
}

export function isRfqRecentlyPosted(createdAt?: string | null, withinDays = 7): boolean {
  if (!createdAt) return false;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return false;
  const diff = Date.now() - created.getTime();
  return diff >= 0 && diff <= withinDays * 24 * 60 * 60 * 1000;
}

export function shouldShowRfqStatusBadge(status?: string | null, variant: "buyer" | "seller" = "buyer"): boolean {
  if (variant === "buyer") return true;
  const value = (status ?? "").toUpperCase();
  if (value.includes("PUBLISH") || value.includes("OPEN")) return false;
  return Boolean(value);
}

/** Returns null when quantity should be hidden entirely. */
export function formatRfqQuantity(
  rfq: Pick<ApiRfqListItem, "quantity" | "unit">
): string | null {
  if (rfq.quantity == null || !Number.isFinite(rfq.quantity)) return null;
  const unit = rfq.unit?.trim();
  return unit ? `${rfq.quantity} ${unit}` : String(rfq.quantity);
}

export function formatRfqQuoteCount(count?: number | null): string {
  if (count == null || count <= 0) return "No quotes yet";
  return `${count} quote${count === 1 ? "" : "s"} received`;
}

export function formatRfqDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function isRfqDraft(status?: string | null): boolean {
  return (status ?? "").toUpperCase().includes("DRAFT");
}

export function isRevisionRequested(status?: string | null): boolean {
  const value = (status ?? "").toUpperCase();
  return value.includes("REVISION") || value.includes("NEGOTIAT");
}

/** Seller should revise when buyer asked for changes (quotation or RFQ status). */
export function isQuotationRevisionPending(
  quotation: Pick<ApiQuotation, "status" | "revision_request_remarks">,
  rfqStatus?: string | null
): boolean {
  if (quotation.revision_request_remarks?.trim()) return true;
  if (isRevisionRequested(quotation.status)) return true;
  if (isRevisionRequested(rfqStatus)) return true;
  return false;
}

/** Buyer's revision-request message for the seller to read. */
export function getBuyerRevisionRemarks(
  quotation: Pick<ApiQuotation, "status" | "remarks" | "revision_request_remarks">,
  rfqStatus?: string | null
): string | null {
  const dedicated = quotation.revision_request_remarks?.trim();
  if (dedicated) return dedicated;
  if (isQuotationRevisionPending(quotation, rfqStatus) && quotation.remarks?.trim()) {
    return quotation.remarks.trim();
  }
  return null;
}

export function getSellerRevisionStatusHint(
  quotation: Pick<ApiQuotation, "status" | "remarks" | "revision_request_remarks">,
  rfqStatus?: string | null
): string | null {
  if (!isQuotationRevisionPending(quotation, rfqStatus)) return null;
  const buyerRemarks = getBuyerRevisionRemarks(quotation, rfqStatus);
  if (buyerRemarks) return "The buyer requested changes to your quotation. Review their notes below.";
  return "The buyer requested changes to your quotation.";
}

/** Buyer can accept/reject/request revision only while a quote is awaiting decision. */
export function isQuotationActionableForBuyer(status?: string | null): boolean {
  const value = (status ?? "").toUpperCase();
  if (value.includes("ACCEPT") || value.includes("REJECT") || value.includes("WITHDRAW")) {
    return false;
  }
  if (value.includes("REVISION")) return false;
  return value.includes("PENDING") || value.includes("SUBMIT");
}

/** RFQ is no longer open for new quotes or edits. */
export function isRfqInactiveStatus(status?: string | null): boolean {
  const value = (status ?? "").toUpperCase();
  return value.includes("CANCEL") || value.includes("CLOSE") || value.includes("EXPIRE");
}

/** Quote is no longer actionable for the buyer (dimmed card treatment). */
export function isQuotationInactiveForBuyer(status?: string | null): boolean {
  return !isQuotationActionableForBuyer(status);
}

export function getQuotationStatusHint(status?: string | null): string | null {
  const value = (status ?? "").toUpperCase();
  if (value.includes("WITHDRAW")) {
    return "This seller withdrew their offer — it can no longer be accepted.";
  }
  if (value.includes("REJECT")) return "You rejected this quotation.";
  if (value.includes("ACCEPT")) return "You accepted this quotation.";
  if (value.includes("REVISION")) return "You requested revisions on this quote.";
  return null;
}

export function computeQuotationSubtotal(
  quotation: Pick<ApiQuotation, "price" | "quantity" | "total_amount">
): number | null {
  if (quotation.total_amount != null && Number.isFinite(quotation.total_amount)) {
    return quotation.total_amount;
  }
  if (
    quotation.price != null &&
    quotation.quantity != null &&
    Number.isFinite(quotation.price) &&
    Number.isFinite(quotation.quantity)
  ) {
    return quotation.price * quotation.quantity;
  }
  return null;
}

export function computeQuotationTotalWithGst(
  quotation: Pick<
    ApiQuotation,
    "price" | "quantity" | "total_amount" | "gst_percentage" | "transportation_charge"
  >
): { subtotal: number; gstAmount: number; total: number } | null {
  const subtotal = computeQuotationSubtotal(quotation);
  if (subtotal == null) return null;
  const gstPct = quotation.gst_percentage ?? 0;
  const gstAmount = subtotal * (gstPct / 100);
  const transport = quotation.transportation_charge ?? 0;
  return { subtotal, gstAmount, total: subtotal + gstAmount + transport };
}

/** Map RFQ list tab id to API `status` query param (omit for "all"). */
export function rfqTabToApiStatus(tab: string): string | undefined {
  if (tab === "all") return undefined;
  return tab.toUpperCase();
}

/** Seller can submit a new quote only when they have none, or withdrew the previous one. */
export function canSellerSubmitQuotation(quotation?: ApiQuotation | null): boolean {
  if (!quotation) return true;
  return (quotation.status ?? "").toUpperCase().includes("WITHDRAW");
}

/** Seller can update or withdraw while a quote is still awaiting buyer decision. */
export function canSellerUpdateQuotation(status?: string | null): boolean {
  const value = (status ?? "").toUpperCase();
  if (value.includes("ACCEPT") || value.includes("REJECT") || value.includes("WITHDRAW")) {
    return false;
  }
  if (value.includes("REVISION") || value.includes("NEGOTIAT")) return false;
  return value.includes("PENDING") || value.includes("SUBMIT");
}

/** Seller can withdraw only while a quote is still awaiting buyer decision. */
export function canSellerWithdrawQuotation(status?: string | null): boolean {
  return canSellerUpdateQuotation(status);
}

/** Convert API ISO datetime to YYYY-MM-DD for date inputs. */
export function isoToDateInput(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  return value.length >= 10 ? value.slice(0, 10) : value;
}
