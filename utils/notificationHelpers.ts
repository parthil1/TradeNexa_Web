import type { AppNotification, NotificationUnreadCount } from "@/types/notifications";
import { normalizeAppNotification } from "@/services/notificationService";
import {
  resolveFcmNavigationPath,
  type FcmPushData,
} from "@/utils/fcmNavigation";
import { formatDateListLabel } from "@/utils/dateFormat";

/** Flatten inbox `data` + top-level fields into FCM-style string map for routing. */
export function notificationToFcmData(notification: AppNotification): FcmPushData {
  const map: FcmPushData = {
    type: notification.type || undefined,
    click_action: notification.click_action || undefined,
    title: notification.title || undefined,
    body: notification.body || undefined,
  };

  if (notification.reference_id != null) {
    map.reference_id = String(notification.reference_id);
  }
  if (notification.sender_id != null) {
    map.sender_id = String(notification.sender_id);
  }

  const extra = notification.data;
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (value == null) continue;
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        map[key] = String(value);
      }
    }
  }

  return map;
}

export function resolveNotificationPath(
  notification: AppNotification,
  activeRole?: "buyer" | "seller" | null
): string {
  return resolveFcmNavigationPath(notificationToFcmData(notification), activeRole);
}

export function formatNotificationTime(value?: string | null): string {
  return formatDateListLabel(value) || "";
}

function toNonNegativeInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.trunc(value));
  }
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    if (Number.isFinite(n)) return Math.max(0, Math.trunc(n));
  }
  return null;
}

/** Normalize REST / socket unread-count payloads with buyer/seller breakdown. */
export function normalizeUnreadCountPayload(
  payload: unknown
): NotificationUnreadCount | null {
  if (payload == null) return null;

  if (typeof payload === "number" && Number.isFinite(payload)) {
    const n = Math.max(0, Math.trunc(payload));
    return { total: n, buyer: n, seller: 0, unread_count: n, role: null };
  }

  if (typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  const nested =
    record.data && typeof record.data === "object" && !Array.isArray(record.data)
      ? (record.data as Record<string, unknown>)
      : record;

  const buyer = toNonNegativeInt(nested.buyer ?? record.buyer);
  const seller = toNonNegativeInt(nested.seller ?? record.seller);
  const unreadCount = toNonNegativeInt(nested.unread_count ?? record.unread_count);
  const total = toNonNegativeInt(nested.total ?? record.total);

  if (buyer == null && seller == null && unreadCount == null && total == null) {
    return null;
  }

  const resolvedBuyer = buyer ?? 0;
  const resolvedSeller = seller ?? 0;
  const resolvedUnread =
    unreadCount ?? resolvedBuyer + resolvedSeller;
  const resolvedTotal = total ?? resolvedUnread;
  const roleRaw = nested.role ?? record.role;
  const role =
    roleRaw === "buyer" || roleRaw === "seller" ? roleRaw : null;

  return {
    total: resolvedTotal,
    buyer: resolvedBuyer,
    seller: resolvedSeller,
    unread_count: resolvedUnread,
    role,
  };
}

/** Pick badge count for the active portal role. */
export function unreadCountForRole(
  counts: NotificationUnreadCount,
  role: "buyer" | "seller"
): number {
  if (counts.role === "buyer" || counts.role === "seller") {
    return Math.max(0, counts.unread_count);
  }
  return Math.max(0, role === "seller" ? counts.seller : counts.buyer);
}

/** @deprecated Prefer normalizeUnreadCountPayload + unreadCountForRole. */
export function parseUnreadCountPayload(payload: unknown): number | null {
  const counts = normalizeUnreadCountPayload(payload);
  if (!counts) return null;
  return Math.max(0, counts.unread_count);
}

export function extractNotificationFromSocketPayload(
  payload: unknown
): AppNotification | null {
  if (payload == null || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  if (record.notification && typeof record.notification === "object") {
    return normalizeAppNotification(record.notification);
  }
  if (record.data && typeof record.data === "object") {
    const data = record.data as Record<string, unknown>;
    if (data.notification && typeof data.notification === "object") {
      return normalizeAppNotification(data.notification);
    }
    const fromData = normalizeAppNotification(data);
    if (fromData) return fromData;
  }
  return normalizeAppNotification(record);
}

export function isMarkAllUpdatedPayload(payload: unknown): boolean {
  if (payload == null || typeof payload !== "object") return false;
  const record = payload as Record<string, unknown>;
  return record.all === true || (record.notification == null && typeof record.updated === "number");
}