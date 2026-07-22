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
  /** Guide conversations list: `user.profile_image` */
  profile_image?: string | null;
  company_logo?: string | null;
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
  quotation_number?: string | null;
  total_amount?: number | null;
  gst_percentage?: number | null;
  gst_amount?: number | null;
  transportation_charge?: number | null;
  validity_days?: number | null;
  payment_terms?: string | null;
  remarks?: string | null;
  rfq_id?: number | null;
  rfq_title?: string | null;
  rfq_number?: string | null;
  inquiry_id?: number | null;
}

export interface ApiChatRfqPreview {
  id: number;
  title?: string | null;
  rfq_number?: string | null;
  quantity?: number | null;
  unit?: string | null;
  currency?: string | null;
  expected_price?: number | null;
  category_name?: string | null;
  subcategory_name?: string | null;
  city?: string | null;
  status?: string | null;
  description?: string | null;
  quotation_deadline?: string | null;
}

export interface ApiChatMessage {
  id: number;
  conversation_id: number;
  message_type: ChatMessageType;
  content?: string | null;
  sender_id?: number | null;
  sender_role?: string | null;
  sender_name?: string | null;
  sender_company_name?: string | null;
  is_mine?: boolean;
  /** Automated RFQ/quotation status event (not a person-typed message) */
  is_system?: boolean;
  created_at?: string | null;
  read_at?: string | null;
  delivered_at?: string | null;
  product_id?: number | null;
  quotation_id?: number | null;
  inquiry_id?: number | null;
  /** `rfq` | `enquiry` | `inquiry` | `product` from message metadata */
  context_type?: ChatContextType | string | null;
  product?: ApiChatProductPreview | null;
  quotation?: ApiChatQuotationPreview | null;
  /** RFQ context from QUOTATION / SYSTEM message metadata */
  rfq?: ApiChatRfqPreview | null;
  media_url?: string | null;
  file_url?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  /** Client-only optimistic state */
  client_id?: string;
  send_status?: ChatSendStatus;
}

export type ChatContextType = "product" | "rfq" | "enquiry" | "inquiry";

export interface ApiChatLastContext {
  type: ChatContextType | string;
  id?: number | null;
  title?: string | null;
}

export interface ApiChatConversation {
  id: number;
  conversation_id?: number | null;
  rfq_id?: number | null;
  rfq_title?: string | null;
  rfq_reference?: string | null;
  inquiry_id?: number | null;
  last_context?: ApiChatLastContext | null;
  unread_count?: number | null;
  last_message?: ApiChatMessage | string | null;
  last_message_at?: string | null;
  last_message_sender_id?: number | null;
  participants?: ApiChatParticipant[];
  buyer?: ApiChatParticipant | null;
  seller?: ApiChatParticipant | null;
  other_party?: ApiChatParticipant | null;
  buyer_id?: number | null;
  seller_id?: number | null;
  is_active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ChatUnreadConversationSnap {
  conversation_id: number;
  unread_count: number;
  last_message_at?: string | null;
  last_message?: string | null;
  last_message_sender_id?: number | null;
}

export interface ChatUnreadSummary {
  /** Normalized badge total (maps API `total` / `total_unread`). */
  total_unread: number;
  /** Guide: unread_summary / GET → as_buyer */
  as_buyer?: number;
  /** Guide: unread_summary / GET → as_seller */
  as_seller?: number;
  /** Guide socket unread_summary.conversations — live unread + last activity */
  conversations?: ChatUnreadConversationSnap[];
  conversations_unread?: number;
}

/** Exactly one of rfq_id or inquiry_id (guide XOR). */
export type CreateConversationPayload =
  | { inquiry_id: number; rfq_id?: never; seller_id?: never }
  | { rfq_id: number; seller_id?: number; inquiry_id?: never };

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
  /** Optional — defaults to latest on the server. */
  last_read_message_id?: number;
}

export interface ChatListParams {
  page?: number;
  limit?: number;
  role?: ChatRole;
  rfq_id?: number;
  inquiry_id?: number;
  context_type?: "rfq" | "inquiry";
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface ChatMessagesParams extends ChatListParams {
  order?: "asc" | "desc";
  before_id?: number;
  after_id?: number;
}

export type ChatConversationListResult = PaginatedResult<ApiChatConversation>;
export type ChatMessageListResult = PaginatedResult<ApiChatMessage>;

export type { ApiPagination };
