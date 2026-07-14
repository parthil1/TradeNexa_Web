import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/config/endpoints";
import { unwrapApiPayload } from "@/utils/authHelpers";
import {
  normalizeChatConversation,
  normalizeChatMessage,
  normalizeUnreadSummary,
  unwrapChatPaginated,
} from "@/utils/chatHelpers";
import { formatApiErrorMessage } from "@/utils/apiErrors";
import type {
  ApiChatConversation,
  ApiChatMessage,
  ChatConversationListResult,
  ChatListParams,
  ChatMessageListResult,
  ChatMessagesParams,
  ChatUnreadSummary,
  CreateConversationPayload,
  MarkReadPayload,
  SendMessagePayload,
} from "@/types/chat";

function buildListParams(params?: ChatListParams | ChatMessagesParams) {
  const query: Record<string, string | number> = {
    page: params?.page ?? 1,
    limit: params?.limit ?? 20,
  };
  if (!params) return query;

  if (params.role) query.role = params.role;
  if (params.rfq_id != null && Number.isFinite(params.rfq_id)) {
    query.rfq_id = params.rfq_id;
  }
  if (params.inquiry_id != null && Number.isFinite(params.inquiry_id)) {
    query.inquiry_id = params.inquiry_id;
  }
  if (params.context_type) query.context_type = params.context_type;
  if (params.search?.trim()) query.search = params.search.trim();
  if (params.sort_by) query.sort_by = params.sort_by;
  if (params.sort_order) query.sort_order = params.sort_order;

  if ("order" in params && params.order) {
    query.order = params.order;
  }
  if ("before_id" in params && params.before_id != null && Number.isFinite(params.before_id)) {
    query.before_id = params.before_id;
  }
  if ("after_id" in params && params.after_id != null && Number.isFinite(params.after_id)) {
    query.after_id = params.after_id;
  }
  return query;
}

export async function fetchConversations(
  params?: ChatListParams
): Promise<ChatConversationListResult> {
  const response = await apiClient.get(API_ENDPOINTS.CHATS_CONVERSATIONS, {
    params: buildListParams(params),
  });
  const data = unwrapApiPayload<unknown>(response.data);
  return unwrapChatPaginated(data, normalizeChatConversation, params?.page, params?.limit);
}

export async function fetchUnreadSummary(): Promise<ChatUnreadSummary> {
  const response = await apiClient.get(API_ENDPOINTS.CHATS_UNREAD_SUMMARY);
  const data = unwrapApiPayload<unknown>(response.data);
  return normalizeUnreadSummary(data);
}

export async function fetchRfqConversations(
  rfqId: number,
  params?: ChatListParams
): Promise<ChatConversationListResult> {
  const query = buildListParams({ ...params, limit: params?.limit ?? 10 });
  const page = params?.page;
  const limit = params?.limit ?? 10;

  // Prefer the shared list + rfq_id filter. `/chats/rfqs/:id/conversations` returns
  // 403 for sellers (and floods the console when quotations hydrate every RFQ).
  try {
    const response = await apiClient.get(API_ENDPOINTS.CHATS_CONVERSATIONS, {
      params: { ...query, rfq_id: rfqId },
    });
    const data = unwrapApiPayload<unknown>(response.data);
    const list = unwrapChatPaginated(data, normalizeChatConversation, page, limit);
    const filtered = list.results.filter((c) => c.rfq_id == null || c.rfq_id === rfqId);
    return { ...list, results: filtered };
  } catch (listError) {
    try {
      const response = await apiClient.get(
        `${API_ENDPOINTS.CHATS_RFQ_CONVERSATIONS}/${rfqId}/conversations`,
        { params: query }
      );
      const data = unwrapApiPayload<unknown>(response.data);
      return unwrapChatPaginated(data, normalizeChatConversation, page, limit);
    } catch {
      throw listError;
    }
  }
}

export async function createConversation(
  payload: CreateConversationPayload
): Promise<ApiChatConversation> {
  let body: Record<string, number>;
  if ("inquiry_id" in payload && payload.inquiry_id != null) {
    body = { inquiry_id: payload.inquiry_id };
  } else if ("rfq_id" in payload && payload.rfq_id != null) {
    body =
      payload.seller_id != null
        ? { rfq_id: payload.rfq_id, seller_id: payload.seller_id }
        : { rfq_id: payload.rfq_id };
  } else {
    throw new Error("Provide exactly one of rfq_id or inquiry_id");
  }

  const response = await apiClient.post(API_ENDPOINTS.CHATS_CONVERSATIONS, body);
  const data = unwrapApiPayload<unknown>(response.data);
  const conversation =
    normalizeChatConversation(data) ??
    normalizeChatConversation(readNested(data)) ??
    normalizeChatConversation(
      data && typeof data === "object" && "data" in data
        ? (data as { data: unknown }).data
        : null
    );
  if (!conversation) {
    console.error("[chat] createConversation unexpected payload:", data);
    throw new Error("Failed to create conversation");
  }
  return conversation;
}

function readNested(data: unknown): unknown {
  if (data && typeof data === "object" && "conversation" in data) {
    return (data as { conversation: unknown }).conversation;
  }
  return data;
}

export async function fetchConversation(conversationId: number): Promise<ApiChatConversation> {
  const response = await apiClient.get(`${API_ENDPOINTS.CHATS_CONVERSATIONS}/${conversationId}`);
  const data = unwrapApiPayload<unknown>(response.data);
  const conversation = normalizeChatConversation(data) ?? normalizeChatConversation(readNested(data));
  if (!conversation) throw new Error("Conversation not found");
  return conversation;
}

export async function fetchMessages(
  conversationId: number,
  params?: ChatMessagesParams
): Promise<ChatMessageListResult> {
  const response = await apiClient.get(
    `${API_ENDPOINTS.CHATS_CONVERSATIONS}/${conversationId}/messages`,
    {
      params: buildListParams({
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
        order: params?.order ?? "asc",
        before_id: params?.before_id,
        after_id: params?.after_id,
      }),
    }
  );
  const data = unwrapApiPayload<unknown>(response.data);
  return unwrapChatPaginated(data, normalizeChatMessage, params?.page, params?.limit ?? 20);
}

/** GET a single message — used when list/socket payloads omit media URLs. */
export async function fetchMessage(
  conversationId: number,
  messageId: number
): Promise<ApiChatMessage | null> {
  try {
    const response = await apiClient.get(
      `${API_ENDPOINTS.CHATS_CONVERSATIONS}/${conversationId}/messages/${messageId}`
    );
    const data = unwrapApiPayload<unknown>(response.data);
    return (
      normalizeChatMessage(data) ??
      normalizeChatMessage(
        data && typeof data === "object" && "message" in data
          ? (data as { message: unknown }).message
          : null
      )
    );
  } catch {
    return null;
  }
}

function isEphemeralMediaUrl(url?: string | null): boolean {
  if (!url) return true;
  return url.startsWith("blob:") || url.startsWith("data:");
}

/**
 * Resolve a backend media URL for a chat IMAGE message.
 * Prefers API `media_url` / message detail — never returns a local file blob.
 * Binary endpoints are only used to discover a JSON URL payload.
 */
export async function resolveChatImageSrc(
  message: Pick<ApiChatMessage, "id" | "conversation_id" | "media_url" | "file_url" | "message_type">
): Promise<string | null> {
  const existing = message.media_url || message.file_url;
  if (existing && !isEphemeralMediaUrl(existing)) return existing;

  if (message.id <= 0 || !message.conversation_id) return null;

  const detailed = await fetchMessage(message.conversation_id, message.id);
  const fromDetail = detailed?.media_url || detailed?.file_url;
  if (fromDetail && !isEphemeralMediaUrl(fromDetail)) return fromDetail;

  const binaryPaths = [
    `${API_ENDPOINTS.CHATS_CONVERSATIONS}/${message.conversation_id}/messages/${message.id}/media`,
    `${API_ENDPOINTS.CHATS_CONVERSATIONS}/${message.conversation_id}/messages/${message.id}/file`,
    `${API_ENDPOINTS.CHATS_CONVERSATIONS}/${message.conversation_id}/messages/${message.id}/download`,
  ];

  for (const path of binaryPaths) {
    try {
      const response = await apiClient.get(path, {
        responseType: "blob",
        validateStatus: (status) => status >= 200 && status < 500,
      });
      if (response.status !== 200 || !response.data) continue;

      const contentType = String(response.headers?.["content-type"] ?? "");
      if (!contentType.includes("application/json")) continue;

      try {
        const text = await (response.data as Blob).text();
        const json = JSON.parse(text) as unknown;
        const normalized =
          normalizeChatMessage(json) ??
          normalizeChatMessage(
            json && typeof json === "object" && "data" in json
              ? (json as { data: unknown }).data
              : json
          );
        const url = normalized?.media_url || normalized?.file_url;
        if (url && !isEphemeralMediaUrl(url)) return url;
        if (json && typeof json === "object") {
          const record = json as Record<string, unknown>;
          const nested =
            (typeof record.url === "string" && record.url) ||
            (typeof record.media_url === "string" && record.media_url) ||
            (typeof record.file_url === "string" && record.file_url);
          if (nested && !isEphemeralMediaUrl(nested)) return nested;
        }
      } catch {
        /* try next */
      }
    } catch {
      /* try next candidate */
    }
  }

  return null;
}

export async function sendMessage(
  conversationId: number,
  payload: SendMessagePayload
): Promise<ApiChatMessage> {
  const response = await apiClient.post(
    `${API_ENDPOINTS.CHATS_CONVERSATIONS}/${conversationId}/messages`,
    payload
  );
  const data = unwrapApiPayload<unknown>(response.data);
  const message =
    normalizeChatMessage(data) ??
    normalizeChatMessage(
      data && typeof data === "object" && "message" in data
        ? (data as { message: unknown }).message
        : null
    );
  if (!message) throw new Error("Failed to send message");
  return message;
}

export async function sendMediaMessage(
  conversationId: number,
  params: {
    message_type: "IMAGE" | "DOCUMENT";
    file: File;
    content?: string;
  }
): Promise<ApiChatMessage> {
  const formData = new FormData();
  formData.append("message_type", params.message_type);
  formData.append("file", params.file, params.file.name);
  // Some backends read a separate filename field instead of multipart filename.
  formData.append("file_name", params.file.name);
  formData.append("original_name", params.file.name);
  formData.append("filename", params.file.name);
  if (params.content?.trim()) formData.append("content", params.content.trim());

  const response = await apiClient.post(
    `${API_ENDPOINTS.CHATS_CONVERSATIONS}/${conversationId}/messages/media`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  const data = unwrapApiPayload<unknown>(response.data);
  const message =
    normalizeChatMessage(data) ??
    normalizeChatMessage(
      data && typeof data === "object" && "message" in data
        ? (data as { message: unknown }).message
        : null
    );
  if (!message) throw new Error("Failed to send media");
  return message;
}

export async function markConversationRead(
  conversationId: number,
  payload?: MarkReadPayload
): Promise<void> {
  await apiClient.post(
    `${API_ENDPOINTS.CHATS_CONVERSATIONS}/${conversationId}/read`,
    payload ?? {}
  );
}

/** Find an existing RFQ conversation without creating one. */
export async function findRfqConversation(options: {
  rfqId: number;
  role: "buyer" | "seller";
  sellerId?: number;
}): Promise<ApiChatConversation | null> {
  try {
    const existing = await fetchRfqConversations(options.rfqId, { page: 1, limit: 10 });
    if (options.role === "buyer" && options.sellerId) {
      return (
        existing.results.find((c) => {
          const sellerUserId = c.seller?.user_id ?? c.seller?.id;
          const otherId = c.other_party?.user_id ?? c.other_party?.id;
          return sellerUserId === options.sellerId || otherId === options.sellerId;
        }) ?? null
      );
    }
    return existing.results[0] ?? null;
  } catch (err) {
    console.warn("[chat] findRfqConversation failed:", err);
    return null;
  }
}

/**
 * Create a conversation for an RFQ.
 * Buyer: { rfq_id, seller_id } — buyer starts directly.
 * Seller: { rfq_id } — seller starts when buyer has not.
 */
export async function startRfqConversation(options: {
  rfqId: number;
  role: "buyer" | "seller";
  sellerId?: number;
}): Promise<ApiChatConversation> {
  if (options.role === "buyer") {
    if (!options.sellerId) {
      throw new Error(
        "Missing seller id on this quotation. The seller account must be linked before chat can start."
      );
    }
    return createConversation({ rfq_id: options.rfqId, seller_id: options.sellerId });
  }
  return createConversation({ rfq_id: options.rfqId });
}

/** Resolve or create the conversation for an RFQ detail page. */
export async function ensureRfqConversation(options: {
  rfqId: number;
  role: "buyer" | "seller";
  sellerId?: number;
}): Promise<ApiChatConversation> {
  const existing = await findRfqConversation(options);
  if (existing) return existing;
  return startRfqConversation(options);
}

/** Open / continue the shared pair thread for a product inquiry. */
export async function ensureInquiryConversation(
  inquiryId: number
): Promise<ApiChatConversation> {
  try {
    const existing = await fetchConversations({
      page: 1,
      limit: 5,
      inquiry_id: inquiryId,
    });
    if (existing.results[0]) return existing.results[0];
  } catch {
    /* fall through to create */
  }

  try {
    const response = await apiClient.get(
      `${API_ENDPOINTS.CHATS_INQUIRY_CONVERSATIONS}/${inquiryId}/conversations`,
      { params: { page: 1, limit: 1 } }
    );
    const data = unwrapApiPayload<unknown>(response.data);
    const list = unwrapChatPaginated(data, normalizeChatConversation, 1, 1);
    if (list.results[0]) return list.results[0];
  } catch {
    /* fall through to create */
  }

  return createConversation({ inquiry_id: inquiryId });
}

function getErrorMessage(err: unknown, fallback: string): string {
  return formatApiErrorMessage(err, fallback);
}

export { getErrorMessage as getChatErrorMessage };
