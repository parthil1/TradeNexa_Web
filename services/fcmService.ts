import { getToken } from "firebase/messaging";
import {
  FIREBASE_VAPID_KEY,
  getFirebaseMessaging,
  isFirebaseConfigured,
} from "@/config/firebase";

const FCM_TOKEN_STORAGE_KEY = "fcm_token";
const FCM_SW_PATH = "/api/firebase-messaging-sw";

/** Static device type for web login / verify-otp. */
export const WEB_DEVICE_TYPE = "web" as const;

async function registerMessagingServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
  try {
    return await navigator.serviceWorker.register(FCM_SW_PATH, { scope: "/" });
  } catch (err) {
    console.warn("[fcm] Service worker registration failed:", err);
    return null;
  }
}

/**
 * Request notification permission (if needed) and return an FCM registration token.
 * Returns "" when Firebase is not configured or permission is denied so login still works.
 */
export async function getFcmToken(): Promise<string> {
  if (typeof window === "undefined") return "";

  const cached = localStorage.getItem(FCM_TOKEN_STORAGE_KEY)?.trim();
  if (cached) return cached;

  if (!isFirebaseConfigured() || !FIREBASE_VAPID_KEY) {
    console.warn(
      "[fcm] Firebase env vars missing — login will send an empty device_token. Add NEXT_PUBLIC_FIREBASE_* to .env.local."
    );
    return "";
  }

  try {
    if (!("Notification" in window)) return "";

    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }
    if (permission !== "granted") return "";

    const messaging = await getFirebaseMessaging();
    if (!messaging) return "";

    const registration = await registerMessagingServiceWorker();
    const token = await getToken(messaging, {
      vapidKey: FIREBASE_VAPID_KEY,
      ...(registration ? { serviceWorkerRegistration: registration } : {}),
    });

    const trimmed = token?.trim() || "";
    if (trimmed) {
      localStorage.setItem(FCM_TOKEN_STORAGE_KEY, trimmed);
    }
    return trimmed;
  } catch (err) {
    console.warn("[fcm] Failed to get FCM token:", err);
    return "";
  }
}

/** Nested `device` object for verify-otp / register body. */
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
