import type { ApiPagination, PaginatedResult } from "@/types/catalog";

export type ChatMessageType =
  | "TEXT"
  | "PRODUCT"
  | "QUOTATION"
  | "IMAGE"
  | "DOCUMENT"
  | "SYSTEM";

export type ChatRole = "buyer" | "seller";

export type ChatSendStatus = "sending" | "sent" | "failed";

export interface ApiChatParticipant {
  id?: number;
  user_id?: number;
  name?: string | null;
  company_name?: string | null;
  role?: string | null;
  is_online?: boolean | null;
}

export interface ApiChatProductPreview {
  id: number;
  name?: string | null;
  thumbnail?: string | null;
  price?: number | null;
  currency?: string | null;
  unit?: string | null;
}

export interface ApiChatQuotationPreview {
  id: number;
  price?: number | null;
  quantity?: number | null;
  unit?: string | null;
  delivery_days?: number | null;
  currency?: string | null;
  status?: string | null;
}

export interface ApiChatMessage {
  id: number;
  conversation_id: number;
  message_type: ChatMessageType;
  content?: string | null;
  sender_id?: number | null;
  sender_role?: string | null;
  sender_name?: string | null;
  is_mine?: boolean;
  /** Automated RFQ/quotation status event (not a person-typed message) */
  is_system?: boolean;
  created_at?: string | null;
  read_at?: string | null;
  delivered_at?: string | null;
  product_id?: number | null;
  quotation_id?: number | null;
  product?: ApiChatProductPreview | null;
  quotation?: ApiChatQuotationPreview | null;
  media_url?: string | null;
  file_url?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  /** Client-only optimistic state */
  client_id?: string;
  send_status?: ChatSendStatus;
}

export interface ApiChatConversation {
  id: number;
  rfq_id?: number | null;
  rfq_title?: string | null;
  rfq_reference?: string | null;
  unread_count?: number | null;
  last_message?: ApiChatMessage | null;
  last_message_at?: string | null;
  participants?: ApiChatParticipant[];
  buyer?: ApiChatParticipant | null;
  seller?: ApiChatParticipant | null;
  other_party?: ApiChatParticipant | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ChatUnreadSummary {
  total_unread: number;
  conversations_unread?: number;
}

export interface CreateConversationPayload {
  rfq_id: number;
  seller_id?: number;
}

export interface SendTextMessagePayload {
  message_type: "TEXT";
  content: string;
}

export interface SendProductMessagePayload {
  message_type: "PRODUCT";
  product_id: number;
}

export interface SendQuotationMessagePayload {
  message_type: "QUOTATION";
  quotation_id: number;
}

export type SendMessagePayload =
  | SendTextMessagePayload
  | SendProductMessagePayload
  | SendQuotationMessagePayload;

export interface MarkReadPayload {
  last_read_message_id: number;
}

export interface ChatListParams {
  page?: number;
  limit?: number;
}

export interface ChatMessagesParams extends ChatListParams {
  order?: "asc" | "desc";
}

export type ChatConversationListResult = PaginatedResult<ApiChatConversation>;
export type ChatMessageListResult = PaginatedResult<ApiChatMessage>;

export type { ApiPagination };
