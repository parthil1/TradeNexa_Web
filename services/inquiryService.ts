import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/config/endpoints";
import { unwrapApiPayload } from "@/utils/authHelpers";
import {
  normalizeInquiry,
  normalizeInquiryQuotation,
  unwrapInquiryPaginated,
  unwrapInquiryQuotationPaginated,
} from "@/utils/inquiryHelpers";
import type {
  ApiInquiry,
  ApiInquiryQuotation,
  CreateInquiryPayload,
  CreateInquiryQuotationPayload,
  InquiryListParams,
  InquiryListResult,
  InquiryQuotationListResult,
  RejectInquiryPayload,
  UpdateInquiryPayload,
  UpdateInquiryQuotationPayload,
} from "@/types/inquiry";
import type { ApiChatConversation } from "@/types/chat";
import { normalizeChatConversation } from "@/utils/chatHelpers";

function buildListParams(params?: InquiryListParams) {
  const query: Record<string, string | number> = {
    page: params?.page ?? 1,
    limit: params?.limit ?? 10,
  };
  if (!params) return query;

  if (params.search?.trim()) query.search = params.search.trim();
  if (params.status) query.status = params.status;
  if (params.product_id != null && Number.isFinite(params.product_id)) {
    query.product_id = params.product_id;
  }
  if (params.inquiry_id != null && Number.isFinite(params.inquiry_id)) {
    query.inquiry_id = params.inquiry_id;
  }
  if (params.sort_by) query.sort_by = params.sort_by;
  if (params.sort_order) query.sort_order = params.sort_order;
  return query;
}

function unwrapInquiry(data: unknown): ApiInquiry {
  const inquiry =
    normalizeInquiry(data) ??
    normalizeInquiry(
      data && typeof data === "object" && "inquiry" in data
        ? (data as { inquiry: unknown }).inquiry
        : null
    );
  if (!inquiry) {
    console.error("[inquiry] unexpected payload:", data);
    throw new Error("Failed to parse inquiry response");
  }
  return inquiry;
}

function unwrapConversation(data: unknown): ApiChatConversation {
  const conversation =
    normalizeChatConversation(data) ??
    normalizeChatConversation(
      data && typeof data === "object" && "conversation" in data
        ? (data as { conversation: unknown }).conversation
        : null
    );
  if (!conversation) {
    console.error("[inquiry] unexpected conversation payload:", data);
    throw new Error("Failed to open inquiry chat");
  }
  return conversation;
}

/** POST with no body (guide: body = none). */
function postNoBody(url: string) {
  return apiClient.post(url, undefined, {
    headers: { "Content-Type": false },
  });
}

/** POST /inquiries — create product inquiry (auto-creates/reuses chat). */
export async function createInquiry(payload: CreateInquiryPayload): Promise<ApiInquiry> {
  const response = await apiClient.post(API_ENDPOINTS.INQUIRIES, payload);
  return unwrapInquiry(unwrapApiPayload(response.data));
}

/** GET /inquiries/my — buyer inbox */
export async function fetchMyInquiries(
  params?: InquiryListParams
): Promise<InquiryListResult> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 10;
  const response = await apiClient.get(API_ENDPOINTS.INQUIRIES_MY, {
    params: buildListParams(params),
  });
  const data = unwrapApiPayload<unknown>(response.data);
  return unwrapInquiryPaginated(data, normalizeInquiry, page, limit);
}

/** GET /inquiries/seller — seller inbox */
export async function fetchSellerInquiries(
  params?: InquiryListParams
): Promise<InquiryListResult> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 10;
  const response = await apiClient.get(API_ENDPOINTS.INQUIRIES_SELLER, {
    params: buildListParams(params),
  });
  const data = unwrapApiPayload<unknown>(response.data);
  return unwrapInquiryPaginated(data, normalizeInquiry, page, limit);
}

/** GET /inquiries/:id — detail */
export async function fetchInquiryById(
  id: number,
  options?: { mark_viewed?: boolean }
): Promise<ApiInquiry> {
  const response = await apiClient.get(`${API_ENDPOINTS.INQUIRIES}/${id}`, {
    params:
      options?.mark_viewed === false
        ? { mark_viewed: false }
        : undefined,
  });
  return unwrapInquiry(unwrapApiPayload(response.data));
}

/** PUT /inquiries/:id — buyer update (pending only) */
export async function updateInquiry(
  id: number,
  payload: UpdateInquiryPayload
): Promise<ApiInquiry> {
  const response = await apiClient.put(`${API_ENDPOINTS.INQUIRIES}/${id}`, payload);
  return unwrapInquiry(unwrapApiPayload(response.data));
}

/** POST /inquiries/:id/cancel — buyer cancel */
export async function cancelInquiry(id: number): Promise<ApiInquiry> {
  const response = await postNoBody(`${API_ENDPOINTS.INQUIRIES}/${id}/cancel`);
  return unwrapInquiry(unwrapApiPayload(response.data));
}

/** POST /inquiries/:id/reject — seller reject */
export async function rejectInquiry(
  id: number,
  payload?: RejectInquiryPayload
): Promise<ApiInquiry> {
  const body =
    payload?.reason?.trim() || payload?.reject_reason?.trim()
      ? {
          reason: payload.reason?.trim() || payload.reject_reason?.trim(),
        }
      : {};
  const response = await apiClient.post(`${API_ENDPOINTS.INQUIRIES}/${id}/reject`, body);
  return unwrapInquiry(unwrapApiPayload(response.data));
}

/** POST /inquiries/:id/quotations — seller send quote */
export async function submitInquiryQuotation(
  inquiryId: number,
  payload: CreateInquiryQuotationPayload
): Promise<ApiInquiry> {
  const response = await apiClient.post(
    `${API_ENDPOINTS.INQUIRIES}/${inquiryId}/quotations`,
    payload
  );
  return unwrapInquiry(unwrapApiPayload(response.data));
}

/** PUT /inquiries/quotations/:quotationId — update quote */
export async function updateInquiryQuotation(
  quotationId: number,
  payload: UpdateInquiryQuotationPayload
): Promise<ApiInquiry> {
  const response = await apiClient.put(
    `${API_ENDPOINTS.INQUIRIES_QUOTATIONS}/${quotationId}`,
    payload
  );
  return unwrapInquiry(unwrapApiPayload(response.data));
}

/** POST /inquiries/quotations/:quotationId/withdraw */
export async function withdrawInquiryQuotation(
  quotationId: number
): Promise<ApiInquiry> {
  const response = await postNoBody(
    `${API_ENDPOINTS.INQUIRIES_QUOTATIONS}/${quotationId}/withdraw`
  );
  return unwrapInquiry(unwrapApiPayload(response.data));
}

/** POST /inquiries/quotations/:quotationId/accept — buyer */
export async function acceptInquiryQuotation(
  quotationId: number
): Promise<ApiInquiry> {
  const response = await postNoBody(
    `${API_ENDPOINTS.INQUIRIES_QUOTATIONS}/${quotationId}/accept`
  );
  return unwrapInquiry(unwrapApiPayload(response.data));
}

/** POST /inquiries/quotations/:quotationId/reject — buyer */
export async function rejectInquiryQuotation(
  quotationId: number
): Promise<ApiInquiry> {
  const response = await postNoBody(
    `${API_ENDPOINTS.INQUIRIES_QUOTATIONS}/${quotationId}/reject`
  );
  return unwrapInquiry(unwrapApiPayload(response.data));
}

/** GET /inquiries/seller/quotations */
export async function fetchSellerInquiryQuotations(
  params?: InquiryListParams
): Promise<InquiryQuotationListResult> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 10;
  const response = await apiClient.get(API_ENDPOINTS.INQUIRIES_SELLER_QUOTATIONS, {
    params: buildListParams(params),
  });
  const data = unwrapApiPayload<unknown>(response.data);
  return unwrapInquiryQuotationPaginated(data, page, limit);
}

/**
 * POST /inquiries/:id/chat — continue shared buyer–seller thread.
 * Prefer this (or POST /chats/conversations { inquiry_id }) before opening ChatPanel.
 */
export async function openInquiryChat(inquiryId: number): Promise<ApiChatConversation> {
  const response = await postNoBody(`${API_ENDPOINTS.INQUIRIES}/${inquiryId}/chat`);
  return unwrapConversation(unwrapApiPayload(response.data));
}

/** Find the buyer's inquiry for a product (for Continue Chat CTAs). */
export async function findMyInquiryForProduct(
  productId: number
): Promise<ApiInquiry | null> {
  try {
    const list = await fetchMyInquiries({
      page: 1,
      limit: 5,
      product_id: productId,
      sort_by: "created_at",
      sort_order: "desc",
    });
    return (
      list.results.find((item) => item.product_id === productId) ??
      list.results[0] ??
      null
    );
  } catch (err) {
    console.warn("[inquiry] findMyInquiryForProduct failed:", err);
    return null;
  }
}

export function getInquiryErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message.trim();
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export type { ApiInquiryQuotation };
