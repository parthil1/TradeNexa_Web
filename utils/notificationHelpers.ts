import type { AppNotification } from "@/types/notifications";
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

export function parseUnreadCountPayload(payload: unknown): number | null {
  if (payload == null) return null;
  if (typeof payload === "number" && Number.isFinite(payload)) {
    return Math.max(0, payload);
  }
  if (typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  const nested =
    record.data && typeof record.data === "object"
      ? (record.data as Record<string, unknown>)
      : record;
  const raw = nested.unread_count ?? record.unread_count;
  if (typeof raw === "number" && Number.isFinite(raw)) return Math.max(0, raw);
  if (typeof raw === "string" && raw.trim()) {
    const n = Number(raw);
    if (Number.isFinite(n)) return Math.max(0, n);
  }
  return null;
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