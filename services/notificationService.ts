import apiClient from "@/services/apiClient";
import { API_ENDPOINTS, notificationReadEndpoint } from "@/config/endpoints";
import { unwrapApiPayload } from "@/utils/authHelpers";
import type {
  AppNotification,
  NotificationBulkReadResult,
  NotificationListParams,
  NotificationListResult,
  NotificationMarkReadResult,
  NotificationUnreadCount,
} from "@/types/notifications";
import type { ApiPagination } from "@/types/catalog";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function toNullableNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  return toFiniteNumber(value);
}

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (value === 1 || value === "1" || value === "true") return true;
  return false;
}

/** Normalize a list/socket notification row. */
export function normalizeAppNotification(raw: unknown): AppNotification | null {
  const row = asRecord(raw);
  if (!row) return null;
  const id = toFiniteNumber(row.id);
  if (id == null || id <= 0) return null;

  const dataRaw = row.data;
  let data: Record<string, unknown> | null = null;
  if (typeof dataRaw === "string" && dataRaw.trim()) {
    try {
      const parsed = JSON.parse(dataRaw) as unknown;
      data = asRecord(parsed);
    } catch {
      data = null;
    }
  } else {
    data = asRecord(dataRaw);
  }

  return {
    id,
    user_id: toFiniteNumber(row.user_id) ?? 0,
    type: typeof row.type === "string" ? row.type : "",
    title: typeof row.title === "string" ? row.title : "",
    body: typeof row.body === "string" ? row.body : "",
    reference_id: toNullableNumber(row.reference_id),
    sender_id: toNullableNumber(row.sender_id),
    click_action:
      typeof row.click_action === "string"
        ? row.click_action
        : row.click_action == null
          ? null
          : String(row.click_action),
    data,
    is_read: toBoolean(row.is_read),
    read_at: typeof row.read_at === "string" ? row.read_at : null,
    created_at: typeof row.created_at === "string" ? row.created_at : "",
    updated_at: typeof row.updated_at === "string" ? row.updated_at : "",
  };
}

function unwrapPaginated(payload: unknown): NotificationListResult {
  const root = asRecord(payload) ?? {};
  const nested = asRecord(root.data) ?? root;
  const resultsRaw = nested.results ?? nested.notifications ?? nested.items;
  const list = Array.isArray(resultsRaw) ? resultsRaw : [];
  const paginationRaw = asRecord(nested.pagination) ?? {};

  const pagination: ApiPagination = {
    total: toFiniteNumber(paginationRaw.total) ?? list.length,
    page: toFiniteNumber(paginationRaw.page) ?? 1,
    limit: toFiniteNumber(paginationRaw.limit) ?? (list.length || 10),
    totalPages: toFiniteNumber(paginationRaw.totalPages) ?? 1,
  };

  return {
    results: list
      .map((item) => normalizeAppNotification(item))
      .filter((item): item is AppNotification => item != null),
    pagination,
  };
}

/** GET /api/v1/notifications */
export async function fetchNotifications(
  params?: NotificationListParams
): Promise<NotificationListResult> {
  const query: Record<string, string | number | boolean> = {
    page: params?.page ?? 1,
    limit: params?.limit ?? 20,
  };
  if (typeof params?.is_read === "boolean") query.is_read = params.is_read;
  if (params?.type?.trim()) query.type = params.type.trim();
  if (params?.role === "buyer" || params?.role === "seller") query.role = params.role;

  const response = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS, { params: query });
  return unwrapPaginated(unwrapApiPayload(response.data));
}

/** GET /api/v1/notifications/unread-count */
export async function fetchNotificationUnreadCount(): Promise<NotificationUnreadCount> {
  const response = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS_UNREAD_COUNT);
  const data = asRecord(unwrapApiPayload(response.data)) ?? {};
  return {
    unread_count: Math.max(0, toFiniteNumber(data.unread_count) ?? 0),
  };
}

/** PATCH /api/v1/notifications/:id/read */
export async function markNotificationRead(id: number): Promise<AppNotification> {
  const response = await apiClient.patch(notificationReadEndpoint(id));
  const data = asRecord(unwrapApiPayload(response.data)) ?? {};
  const notification =
    normalizeAppNotification(data.notification) ??
    normalizeAppNotification(data) ??
    null;
  if (!notification) {
    return {
      id,
      user_id: 0,
      type: "",
      title: "",
      body: "",
      reference_id: null,
      sender_id: null,
      click_action: null,
      data: null,
      is_read: true,
      read_at: new Date().toISOString(),
      created_at: "",
      updated_at: "",
    };
  }
  return { ...notification, is_read: true };
}

/** POST /api/v1/notifications/read */
export async function markNotificationsRead(
  ids: number[]
): Promise<NotificationBulkReadResult> {
  const response = await apiClient.post(API_ENDPOINTS.NOTIFICATIONS_READ, { ids });
  const data = asRecord(unwrapApiPayload(response.data)) ?? {};
  return { updated: Math.max(0, toFiniteNumber(data.updated) ?? 0) };
}

/** POST /api/v1/notifications/read-all */
export async function markAllNotificationsRead(): Promise<NotificationBulkReadResult> {
  const response = await apiClient.post(API_ENDPOINTS.NOTIFICATIONS_READ_ALL);
  const data = asRecord(unwrapApiPayload(response.data)) ?? {};
  return { updated: Math.max(0, toFiniteNumber(data.updated) ?? 0) };
}

export type { NotificationMarkReadResult };