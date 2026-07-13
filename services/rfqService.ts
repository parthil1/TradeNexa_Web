import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/config/endpoints";
import { unwrapApiPayload } from "@/utils/authHelpers";
import type {
  ApiQuotation,
  ApiRfqDetail,
  ApiRfqListItem,
  CreateQuotationPayload,
  CreateRfqPayload,
  QuotationListResult,
  QuotationRevisionRequestPayload,
  ReviseQuotationPayload,
  RfqListParams,
  RfqListResult,
  UpdateQuotationPayload,
  UpdateRfqPayload,
} from "@/types/rfq";
import {
  normalizeQuotation,
  normalizeRfqDetail,
  normalizeRfqListItem,
  mapQuotationListResult,
  unwrapRfqPaginated,
} from "@/utils/rfqHelpers";

function getLoggedInUserId(): number | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return undefined;
    const user = JSON.parse(raw) as { id?: string | number; user_id?: number | null };
    if (typeof user.user_id === "number" && Number.isFinite(user.user_id) && user.user_id > 0) {
      return user.user_id;
    }
    const fromId = Number(user.id);
    if (Number.isFinite(fromId) && fromId > 0) return fromId;
  } catch {
    /* ignore */
  }
  return undefined;
}

function buildListParams(params?: RfqListParams) {
  return {
    page: params?.page ?? 1,
    limit: params?.limit ?? 10,
    sort_by: params?.sort_by ?? "created_at",
    sort_order: params?.sort_order ?? "desc",
    ...(params?.search?.trim() ? { search: params.search.trim() } : {}),
    ...(params?.status ? { status: params.status } : {}),
  };
}

function mapRfqList(payload: unknown, page?: number, limit?: number): RfqListResult {
  return unwrapRfqPaginated(payload, normalizeRfqListItem, page, limit);
}

function mapQuotationList(payload: unknown, page?: number, limit?: number): QuotationListResult {
  return mapQuotationListResult(payload, page, limit);
}

/** POST with no body (Postman: body = none). Omits Content-Type so axios does not imply JSON. */
function postNoBody(url: string) {
  return apiClient.post(url, undefined, {
    headers: { "Content-Type": false },
  });
}

/** GET /api/v1/rfqs — public RFQ list */
export async function fetchPublicRfqs(params?: RfqListParams): Promise<RfqListResult> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 10;
  const response = await apiClient.get(API_ENDPOINTS.RFQS, { params: buildListParams(params) });
  const data = unwrapApiPayload<unknown>(response.data);
  return mapRfqList(data, page, limit);
}

/** GET /api/v1/rfqs/latest — latest public RFQs */
export async function fetchLatestRfqs(params?: RfqListParams): Promise<RfqListResult> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 10;
  const response = await apiClient.get(API_ENDPOINTS.RFQS_LATEST, {
    params: { page, limit },
  });
  const data = unwrapApiPayload<unknown>(response.data);
  return mapRfqList(data, page, limit);
}

/** GET /api/v1/rfqs/:id — public RFQ detail */
export async function fetchPublicRfqById(id: number): Promise<ApiRfqDetail | null> {
  const response = await apiClient.get(`${API_ENDPOINTS.RFQS}/${id}`);
  const data = unwrapApiPayload<unknown>(response.data);
  return normalizeRfqDetail(data);
}

/** GET /api/v1/rfqs/my — buyer's RFQs */
export async function fetchMyRfqs(params?: RfqListParams): Promise<RfqListResult> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 10;
  const response = await apiClient.get(API_ENDPOINTS.RFQS_MY, { params: buildListParams(params) });
  const data = unwrapApiPayload<unknown>(response.data);
  return mapRfqList(data, page, limit);
}

/** GET /api/v1/rfqs/:id/quotations — quotations for an RFQ (buyer) */
export async function fetchRfqQuotations(
  rfqId: number,
  params?: RfqListParams
): Promise<QuotationListResult> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 10;

  async function load(withListParams: boolean) {
    const response = await apiClient.get(`${API_ENDPOINTS.RFQS}/${rfqId}/quotations`, {
      params: withListParams ? buildListParams(params) : undefined,
    });
    const data = unwrapApiPayload<unknown>(response.data);
    return mapQuotationList(data, page, limit);
  }

  const withParams = await load(true);
  if (withParams.results.length > 0 || withParams.pagination.total > 0) {
    return withParams;
  }

  // Some backends return a bare array and ignore (or mishandle) list query params.
  return load(false);
}

/** POST /api/v1/rfqs — create RFQ (buyer) */
export async function createRfq(payload: CreateRfqPayload): Promise<ApiRfqDetail> {
  const response = await apiClient.post(API_ENDPOINTS.RFQS, payload, {
    headers: { "Content-Type": "application/json" },
  });
  const data = unwrapApiPayload<unknown>(response.data);
  return normalizeRfqDetail(data) ?? { id: 0, title: payload.title };
}

/** PUT /api/v1/rfqs/:id — update RFQ (buyer, draft only) */
export async function updateRfq(id: number, payload: UpdateRfqPayload): Promise<ApiRfqDetail> {
  const response = await apiClient.put(`${API_ENDPOINTS.RFQS}/${id}`, payload, {
    headers: { "Content-Type": "application/json" },
  });
  const data = unwrapApiPayload<unknown>(response.data);
  return normalizeRfqDetail(data) ?? { id, title: payload.title ?? "RFQ" };
}

/** DELETE /api/v1/rfqs/:id — delete RFQ (buyer) */
export async function deleteRfq(id: number): Promise<void> {
  await apiClient.delete(`${API_ENDPOINTS.RFQS}/${id}`);
}

/** POST /api/v1/rfqs/:id/publish — publish draft RFQ (no body) */
export async function publishRfq(id: number): Promise<ApiRfqDetail> {
  const response = await postNoBody(`${API_ENDPOINTS.RFQS}/${id}/publish`);
  const data = unwrapApiPayload<unknown>(response.data);
  return normalizeRfqDetail(data) ?? { id, title: "RFQ" };
}

/** POST /api/v1/rfqs/:id/cancel — cancel RFQ (no body) */
export async function cancelRfq(id: number): Promise<ApiRfqDetail> {
  const response = await postNoBody(`${API_ENDPOINTS.RFQS}/${id}/cancel`);
  const data = unwrapApiPayload<unknown>(response.data);
  return normalizeRfqDetail(data) ?? { id, title: "RFQ" };
}

/** POST /api/v1/rfqs/quotations/:id/accept (no body) */
export async function acceptQuotation(quotationId: number): Promise<ApiQuotation> {
  const response = await postNoBody(`${API_ENDPOINTS.RFQS}/quotations/${quotationId}/accept`);
  const data = unwrapApiPayload<unknown>(response.data);
  return normalizeQuotation(data) ?? { id: quotationId };
}

/** POST /api/v1/rfqs/quotations/:id/reject (no body) */
export async function rejectQuotation(quotationId: number): Promise<ApiQuotation> {
  const response = await postNoBody(`${API_ENDPOINTS.RFQS}/quotations/${quotationId}/reject`);
  const data = unwrapApiPayload<unknown>(response.data);
  return normalizeQuotation(data) ?? { id: quotationId };
}

/** POST /api/v1/rfqs/quotations/:id/request-revision */
export async function requestQuotationRevision(
  quotationId: number,
  payload: QuotationRevisionRequestPayload
): Promise<ApiQuotation> {
  const response = await apiClient.post(
    `${API_ENDPOINTS.RFQS}/quotations/${quotationId}/request-revision`,
    payload,
    { headers: { "Content-Type": "application/json" } }
  );
  const data = unwrapApiPayload<unknown>(response.data);
  return normalizeQuotation(data) ?? { id: quotationId };
}

/** GET /api/v1/rfqs/seller/feed — seller RFQ feed */
export async function fetchSellerRfqFeed(params?: RfqListParams): Promise<RfqListResult> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 10;
  const buyerId = getLoggedInUserId();
  const response = await apiClient.get(API_ENDPOINTS.RFQS_SELLER_FEED, {
    params: {
      ...buildListParams(params),
      ...(buyerId ? { buyer_id: buyerId } : {}),
    },
  });
  const data = unwrapApiPayload<unknown>(response.data);
  return mapRfqList(data, page, limit);
}

/** GET /api/v1/rfqs/seller/:id — seller view of RFQ */
export async function fetchSellerRfqById(id: number): Promise<ApiRfqDetail | null> {
  const response = await apiClient.get(`${API_ENDPOINTS.RFQS}/seller/${id}`);
  const data = unwrapApiPayload<unknown>(response.data);
  return normalizeRfqDetail(data);
}

/** GET /api/v1/rfqs/seller/quotations — seller's submitted quotations */
export async function fetchSellerQuotations(params?: RfqListParams): Promise<QuotationListResult> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 10;
  const response = await apiClient.get(API_ENDPOINTS.RFQS_SELLER_QUOTATIONS, {
    params: buildListParams(params),
  });
  const data = unwrapApiPayload<unknown>(response.data);
  return mapQuotationList(data, page, limit);
}

/** GET /api/v1/rfqs/seller/quotations/:id */
export async function fetchSellerQuotationById(id: number): Promise<ApiQuotation | null> {
  const response = await apiClient.get(`${API_ENDPOINTS.RFQS}/seller/quotations/${id}`);
  const data = unwrapApiPayload<unknown>(response.data);
  return normalizeQuotation(data);
}

/** Find this seller's quotation for an RFQ (from list API; used when detail omits my_quotation). */
export async function findSellerQuotationForRfq(rfqId: number): Promise<ApiQuotation | null> {
  const { results } = await fetchSellerQuotations({ page: 1, limit: 100, sort_by: "created_at", sort_order: "desc" });
  return results.find((q) => q.rfq_id === rfqId) ?? null;
}

/** POST /api/v1/rfqs/:id/quotations — submit quotation (seller) */
export async function submitQuotation(
  rfqId: number,
  payload: CreateQuotationPayload
): Promise<ApiQuotation> {
  const response = await apiClient.post(`${API_ENDPOINTS.RFQS}/${rfqId}/quotations`, payload, {
    headers: { "Content-Type": "application/json" },
  });
  const data = unwrapApiPayload<unknown>(response.data);
  return normalizeQuotation(data) ?? { id: 0, rfq_id: rfqId };
}

/** PUT /api/v1/rfqs/quotations/:id — seller updates quotation */
export async function updateQuotation(
  quotationId: number,
  payload: UpdateQuotationPayload
): Promise<ApiQuotation> {
  const response = await apiClient.put(`${API_ENDPOINTS.RFQS}/quotations/${quotationId}`, payload, {
    headers: { "Content-Type": "application/json" },
  });
  const data = unwrapApiPayload<unknown>(response.data);
  return normalizeQuotation(data) ?? { id: quotationId };
}

/** POST /api/v1/rfqs/quotations/:id/revise — seller revises after buyer request */
export async function reviseQuotation(
  quotationId: number,
  payload: ReviseQuotationPayload
): Promise<ApiQuotation> {
  const response = await apiClient.post(
    `${API_ENDPOINTS.RFQS}/quotations/${quotationId}/revise`,
    payload,
    { headers: { "Content-Type": "application/json" } }
  );
  const data = unwrapApiPayload<unknown>(response.data);
  return normalizeQuotation(data) ?? { id: quotationId };
}

/**
 * POST /api/v1/rfqs/quotations/:id/withdraw
 *
 * WITHDRAW BODY — NEEDS BACKEND CONFIRMATION:
 * Postman may show a full quotation payload on withdraw, but the design doc says
 * no body. This call intentionally sends NO body (not even `{}`) to avoid shipping
 * stale quotation fields. If withdraw fails, confirm with backend whether a body
 * is required before adding one.
 */
export async function withdrawQuotation(quotationId: number): Promise<ApiQuotation> {
  const response = await postNoBody(`${API_ENDPOINTS.RFQS}/quotations/${quotationId}/withdraw`);
  const data = unwrapApiPayload<unknown>(response.data);
  return normalizeQuotation(data) ?? { id: quotationId };
}

export type { ApiRfqListItem };
