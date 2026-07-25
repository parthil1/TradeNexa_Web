import type { ApiPagination, PaginatedResult } from "@/types/catalog";

/** Inbox types from TradeNexa_Backend `NOTIFICATION_TYPE` / in-app set. */
export type InboxNotificationType =
  | "INQUIRY_RECEIVED"
  | "INQUIRY_REPLY"
  | "INQUIRY_REJECTED"
  | "QUOTATION_RECEIVED"
  | "QUOTATION_UPDATED"
  | "QUOTATION_ACCEPTED"
  | "QUOTATION_REJECTED"
  | "PRODUCT_APPROVED"
  | "PRODUCT_REVISION_REQUIRED"
  | "PRODUCT_REJECTED"
  | "RFQ_RECEIVED"
  | "RFQ_NEW_QUOTATION"
  | "RFQ_QUOTATION_UPDATED"
  | "RFQ_QUOTATION_ACCEPTED"
  | "RFQ_QUOTATION_REJECTED"
  | "RFQ_STATUS_UPDATED"
  | string;

export type NotificationClickAction =
  | "OPEN_CHAT"
  | "OPEN_INQUIRY"
  | "OPEN_QUOTATION"
  | "OPEN_PRODUCT"
  | "OPEN_RFQ"
  | string
  | null;

export interface AppNotification {
  id: number;
  user_id: number;
  type: InboxNotificationType;
  /** Audience side from backend (`notifications.role`) — buyer | seller. */
  role: "buyer" | "seller" | null;
  title: string;
  body: string;
  reference_id: number | null;
  sender_id: number | null;
  click_action: NotificationClickAction;
  data: Record<string, unknown> | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationListParams {
  page?: number;
  limit?: number;
  is_read?: boolean;
  type?: string;
  /** Active portal role — filters inbox to buyer or seller notifications. */
  role?: "buyer" | "seller";
}

export type NotificationListResult = PaginatedResult<AppNotification>;

export interface NotificationUnreadCount {
  total: number;
  buyer: number;
  seller: number;
  /** Legacy / role-scoped single count from API. */
  unread_count: number;
  role: "buyer" | "seller" | null;
}

export interface NotificationMarkReadResult {
  notification: AppNotification;
}

export interface NotificationBulkReadResult {
  updated: number;
}

export type { ApiPagination };