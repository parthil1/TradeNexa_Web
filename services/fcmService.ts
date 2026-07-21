import { getToken, onMessage, type MessagePayload } from "firebase/messaging";
import {
  FIREBASE_VAPID_KEY,
  getFirebaseMessaging,
  isFirebaseConfigured,
} from "@/config/firebase";
import {
  type ActiveRole,
  readStoredActiveRole,
} from "@/utils/roleNavigation";
import {
  resolveFcmNavigationPath,
  type FcmPushData,
} from "@/utils/fcmNavigation";

const FCM_TOKEN_STORAGE_KEY = "fcm_token";
/**
 * Registered at this URL; next.config rewrites it to /api/firebase-messaging-sw
 * so firebase.initializeApp uses NEXT_PUBLIC_FIREBASE_* from env at runtime.
 */
const FCM_SW_PATH = "/firebase-messaging-sw.js";

/** Static device type for web login / verify-otp. */
export const WEB_DEVICE_TYPE = "web" as const;

export type FcmForegroundHandler = (payload: MessagePayload) => void;

/** SW cannot read localStorage — keep active role in SW memory for click redirects. */
export function syncActiveRoleToServiceWorker(role?: ActiveRole | null): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  const resolved = role ?? readStoredActiveRole() ?? "buyer";
  const message = { type: "SET_ACTIVE_ROLE", role: resolved };

  void navigator.serviceWorker.ready.then((registration) => {
    registration.active?.postMessage(message);
  });
  navigator.serviceWorker.controller?.postMessage(message);
}

function resolveFcmRedirectUrl(data: FcmPushData): string {
  return resolveFcmNavigationPath(data, readStoredActiveRole() ?? "buyer");
}

async function registerMessagingServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register(FCM_SW_PATH, {
      scope: "/",
    });
    await navigator.serviceWorker.ready;
    syncActiveRoleToServiceWorker();
    return registration;
  } catch {
    return null;
  }
}

/**
 * Ask for notification permission while still in a user-gesture (e.g. Send OTP click).
 * Browsers only show the dialog when permission is still "default".
 */
export async function ensureNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  if (Notification.permission === "default") {
    return Notification.requestPermission();
  }
  return Notification.permission;
}

/**
 * Request notification permission (if needed) and return the Firebase FCM token.
 * That token is sent as `device.device_token` on verify-otp / register.
 * Returns "" when Firebase is not configured or permission is denied so login still works.
 */
export async function getFcmToken(): Promise<string> {
  if (typeof window === "undefined") return "";

  const cached = localStorage.getItem(FCM_TOKEN_STORAGE_KEY)?.trim();
  if (cached) {
    console.log("[fcm] using cached Firebase token:", cached);
    return cached;
  }

  if (!("Notification" in window)) {
    console.warn("[fcm] Notifications API not available");
    return "";
  }

  let permission = Notification.permission;
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }
  console.log("[fcm] notification permission:", permission);
  if (permission !== "granted") return "";

  if (!isFirebaseConfigured() || !FIREBASE_VAPID_KEY) {
    console.warn("[fcm] Firebase config or VAPID key missing — cannot get token");
    return "";
  }

  try {
    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      console.warn("[fcm] Firebase messaging unavailable");
      return "";
    }

    const registration = await registerMessagingServiceWorker();
    console.log("[fcm] service worker registered:", Boolean(registration));

    const token = await getToken(messaging, {
      vapidKey: FIREBASE_VAPID_KEY,
      ...(registration ? { serviceWorkerRegistration: registration } : {}),
    });

    const trimmed = token?.trim() || "";
    if (trimmed) {
      localStorage.setItem(FCM_TOKEN_STORAGE_KEY, trimmed);
      console.log("[fcm] Firebase token received:", trimmed);
    } else {
      console.warn("[fcm] getToken returned empty");
    }
    return trimmed;
  } catch (err) {
    console.warn("[fcm] failed to get Firebase token:", err);
    return "";
  }
}

/** Nested `device` object for verify-otp / register — `device_token` is the Firebase FCM token. */
export async function buildLoginDevicePayload(): Promise<{
  device_type: typeof WEB_DEVICE_TYPE;
  device_token: string;
}> {
  const device_token = await getFcmToken();
  return {
    device_type: WEB_DEVICE_TYPE,
    device_token,
  };
}

export function getFcmNotificationContent(payload: MessagePayload): {
  title: string;
  body: string;
  url: string;
  data: FcmPushData;
} {
  const data = (payload.data ?? {}) as FcmPushData;
  return {
    title: payload.notification?.title || data.title || "TradeNexa",
    body: payload.notification?.body || data.body || "",
    url: resolveFcmRedirectUrl(data),
    data,
  };
}

/**
 * Register the messaging SW and listen for foreground push messages.
 * Returns an unsubscribe function.
 */
export async function subscribeForegroundMessages(
  handler: FcmForegroundHandler
): Promise<() => void> {
  if (typeof window === "undefined") return () => {};
  if (!isFirebaseConfigured()) return () => {};

  await registerMessagingServiceWorker();

  const messaging = await getFirebaseMessaging();
  if (!messaging) return () => {};

  return onMessage(messaging, (payload) => {
    console.log("[fcm] foreground message:", payload);
    handler(payload);
  });
}
