import { getToken, onMessage, type MessagePayload } from "firebase/messaging";
import {
  FIREBASE_VAPID_KEY,
  getFirebaseMessaging,
  isFirebaseConfigured,
} from "@/config/firebase";
import {
  type ActiveRole,
  applyActiveRoleForUrl,
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

/** Keep SW `cachedActiveRole` in sync for CHAT_MESSAGE click routing only. */
export function syncActiveRoleToServiceWorker(role?: ActiveRole | null): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  const resolved = role ?? readStoredActiveRole() ?? "buyer";
  const message = { type: "SET_ACTIVE_ROLE", role: resolved };

  void navigator.serviceWorker.ready.then((registration) => {
    registration.active?.postMessage(message);
  });
  navigator.serviceWorker.controller?.postMessage(message);
}

/**
 * Switch active role to match the deep-link portal, then navigate.
 * Fixes buyer_seller users landing on the wrong portal home.
 */
export function navigateFromFcmNotification(url: string): void {
  if (typeof window === "undefined" || !url) return;
  console.log("[fcm] notification click → url:", url);
  const role = applyActiveRoleForUrl(url);
  if (role) syncActiveRoleToServiceWorker(role);
  const current = `${window.location.pathname}${window.location.search}`;
  if (url !== current) {
    window.location.assign(url);
  }
}

/** Listen for background SW notification clicks that need a role switch + navigate. */
export function subscribeFcmServiceWorkerNavigation(): () => void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return () => {};
  }

  const onMessage = (event: MessageEvent) => {
    const data = event.data;
    if (!data || data.type !== "FCM_NAVIGATE" || typeof data.url !== "string") return;
    navigateFromFcmNotification(data.url);
  };

  navigator.serviceWorker.addEventListener("message", onMessage);
  return () => navigator.serviceWorker.removeEventListener("message", onMessage);
}

function resolveFcmRedirectUrl(data: FcmPushData): string {
  const url = resolveFcmNavigationPath(data, readStoredActiveRole() ?? "buyer");
  console.log("[fcm] resolved navigation url from type/ids:", url, data);
  return url;
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
 * Always refreshes via Firebase when permission is granted (cached token can go stale).
 * Returns "" when Firebase is not configured or permission is denied so login still works.
 */
export async function getFcmToken(): Promise<string> {
  if (typeof window === "undefined") return "";

  const cached = localStorage.getItem(FCM_TOKEN_STORAGE_KEY)?.trim() || "";

  if (!("Notification" in window)) {
    console.warn("[fcm] Notifications API not available");
    return cached;
  }

  let permission = Notification.permission;
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }
  console.log("[fcm] notification permission:", permission);
  if (permission !== "granted") {
    console.warn("[fcm] permission not granted — pushes will not arrive");
    return "";
  }

  if (!isFirebaseConfigured() || !FIREBASE_VAPID_KEY) {
    console.warn("[fcm] Firebase config or VAPID key missing — cannot get token");
    return cached;
  }

  try {
    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      console.warn("[fcm] Firebase messaging unavailable");
      return cached;
    }

    const registration = await registerMessagingServiceWorker();
    console.log("[fcm] service worker registered:", Boolean(registration));

    const token = await getToken(messaging, {
      vapidKey: FIREBASE_VAPID_KEY,
      ...(registration ? { serviceWorkerRegistration: registration } : {}),
    });

    const trimmed = token?.trim() || "";
    if (trimmed) {
      if (trimmed !== cached) {
        console.log("[fcm] Firebase token updated:", trimmed);
      } else {
        console.log("[fcm] Firebase token ok:", trimmed.slice(0, 24) + "…");
      }
      localStorage.setItem(FCM_TOKEN_STORAGE_KEY, trimmed);
      return trimmed;
    }

    console.warn("[fcm] getToken returned empty — using cache if any");
    return cached;
  } catch (err) {
    console.warn("[fcm] failed to get Firebase token:", err);
    return cached;
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
 * Also refreshes the FCM token so the browser stays subscribed to push.
 * Returns an unsubscribe function.
 */
export async function subscribeForegroundMessages(
  handler: FcmForegroundHandler
): Promise<() => void> {
  if (typeof window === "undefined") return () => {};
  if (!isFirebaseConfigured()) {
    console.warn("[fcm] Firebase not configured — foreground listener skipped");
    return () => {};
  }

  // Ensure push subscription exists even for already-logged-in sessions.
  const token = await getFcmToken();
  console.log("[fcm] foreground listener ready, hasToken:", Boolean(token));

  const messaging = await getFirebaseMessaging();
  if (!messaging) {
    console.warn("[fcm] messaging unavailable — foreground listener skipped");
    return () => {};
  }

  return onMessage(messaging, (payload) => {
    console.log("[fcm] foreground message received:", payload);
    handler(payload);
  });
}
