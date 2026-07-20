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
    const registration = await navigator.serviceWorker.register(FCM_SW_PATH, {
      scope: "/",
    });
    await navigator.serviceWorker.ready;
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
  if (cached) return cached;

  if (!("Notification" in window)) return "";

  // Ask before other checks so the Allow dialog is not skipped when env is slow/misread.
  let permission = Notification.permission;
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }
  if (permission !== "granted") return "";

  if (!isFirebaseConfigured() || !FIREBASE_VAPID_KEY) return "";

  try {
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
  } catch {
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
