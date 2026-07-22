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
const FCM_PENDING_CACHE = "tradenexa-fcm";
const FCM_PENDING_URL = "/__fcm_pending_nav";
const FCM_LAST_NAV_KEY = "tradenexa_fcm_last_nav";
const FCM_SESSION_PENDING_KEY = "tradenexa_fcm_pending_path";

/**
 * Registered at this URL; next.config rewrites it to /api/firebase-messaging-sw
 * so firebase.initializeApp uses NEXT_PUBLIC_FIREBASE_* from env at runtime.
 */
const FCM_SW_PATH = "/firebase-messaging-sw.js";
/** Bump when SW click/nav logic changes so browsers fetch a fresh worker. */
const FCM_SW_VERSION = "20260722d";

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

function stampPendingPath(path: string): void {
  if (!path || path === "/") return;
  const stamp = { path, at: Date.now() };
  try {
    sessionStorage.setItem(FCM_SESSION_PENDING_KEY, JSON.stringify(stamp));
    localStorage.setItem(FCM_LAST_NAV_KEY, JSON.stringify(stamp));
  } catch {
    // ignore
  }
  if (typeof caches !== "undefined") {
    void caches.open(FCM_PENDING_CACHE).then((cache) =>
      cache.put(
        FCM_PENDING_URL,
        new Response(JSON.stringify(stamp), {
          headers: { "Content-Type": "application/json" },
        })
      )
    );
  }
}

/** Read the newest pending deep link from session / localStorage / Cache API. */
export async function readFcmPendingPath(): Promise<{ path: string; at: number } | null> {
  if (typeof window === "undefined") return null;

  const candidates: { path: string; at: number }[] = [];

  const pushRaw = (raw: string | null) => {
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { path?: string; at?: number };
      const path = (parsed.path || "").trim();
      if (path && path !== "/") {
        candidates.push({ path, at: parsed.at || 0 });
      }
    } catch {
      // ignore
    }
  };

  try {
    pushRaw(sessionStorage.getItem(FCM_SESSION_PENDING_KEY));
  } catch {
    // ignore
  }
  try {
    pushRaw(localStorage.getItem(FCM_LAST_NAV_KEY));
  } catch {
    // ignore
  }

  try {
    if (typeof caches !== "undefined") {
      const cache = await caches.open(FCM_PENDING_CACHE);
      const res = await cache.match(FCM_PENDING_URL);
      if (res) pushRaw(await res.text());
    }
  } catch {
    // ignore
  }

  if (!candidates.length) return null;
  return candidates.sort((a, b) => b.at - a.at)[0];
}

export async function clearFcmPendingPath(): Promise<void> {
  try {
    sessionStorage.removeItem(FCM_SESSION_PENDING_KEY);
  } catch {
    // ignore
  }
  try {
    if (typeof caches !== "undefined") {
      const cache = await caches.open(FCM_PENDING_CACHE);
      await cache.delete(FCM_PENDING_URL);
    }
  } catch {
    // ignore
  }
}

/**
 * Switch active role to match the deep-link portal, then navigate.
 * Debounced so duplicate FCM_NAVIGATE messages from one click cannot bounce to "/".
 */
let lastFcmNavPath = "";
let lastFcmNavAt = 0;

export function navigateFromFcmNotification(
  urlOrInput: string | { url?: string; data?: FcmPushData | null }
): void {
  if (typeof window === "undefined") return;

  const input = typeof urlOrInput === "string" ? { url: urlOrInput } : urlOrInput;
  const pushData = (input.data ?? null) as FcmPushData | null;

  let url =
    pushData && (pushData.type || pushData.click_action)
      ? resolveFcmNavigationPath(pushData, readStoredActiveRole() ?? "buyer")
      : (input.url || "").trim();

  // Ignore backend click_url pointing at site root — resolve from type/ids instead.
  try {
    const parsed = url.startsWith("http") ? new URL(url) : null;
    const pathOnly = parsed ? parsed.pathname : url.split("?")[0] || "";
    if (!pathOnly || pathOnly === "/") {
      if (pushData && (pushData.type || pushData.click_action)) {
        url = resolveFcmNavigationPath(pushData, readStoredActiveRole() ?? "buyer");
      } else {
        return;
      }
    }
  } catch {
    // keep url
  }

  if (!url) return;

  let path = url;
  try {
    if (url.startsWith("http")) {
      const u = new URL(url);
      path = `${u.pathname}${u.search}`;
      if (!path || path === "/") return;
    }
  } catch {
    path = url;
  }

  const now = Date.now();
  if (path === lastFcmNavPath && now - lastFcmNavAt < 2000) return;
  lastFcmNavPath = path;
  lastFcmNavAt = now;

  const role = applyActiveRoleForUrl(path);
  if (role) syncActiveRoleToServiceWorker(role);

  const current = `${window.location.pathname}${window.location.search}`;
  if (path !== current) {
    stampPendingPath(path);
    window.location.replace(path);
  }
}

/** Listen for background SW notification clicks that need a role switch + navigate. */
export function subscribeFcmServiceWorkerNavigation(): () => void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return () => {};
  }

  const onMessage = (event: MessageEvent) => {
    const data = event.data;
    if (!data || typeof data !== "object") return;

    // SW cannot write localStorage — mirror pending deep link here.
    if (data.type === "FCM_STAMP" && typeof data.path === "string") {
      const path = data.path.trim();
      if (path && path !== "/") stampPendingPath(path);
      return;
    }

    if (data.type !== "FCM_NAVIGATE") return;

    // SW already opened a new tab via clients.openWindow — only sync role here.
    if (data.skipNavigate) {
      const path =
        typeof data.url === "string"
          ? data.url
          : data.data && typeof data.data === "object"
            ? resolveFcmNavigationPath(
                data.data as FcmPushData,
                readStoredActiveRole() ?? "buyer"
              )
            : "";
      if (path && path !== "/") {
        stampPendingPath(path);
        const role = applyActiveRoleForUrl(path);
        if (role) syncActiveRoleToServiceWorker(role);
      }
      return;
    }

    navigateFromFcmNotification({
      url: typeof data.url === "string" ? data.url : undefined,
      data: data.data && typeof data.data === "object" ? (data.data as FcmPushData) : null,
    });
  };

  navigator.serviceWorker.addEventListener("message", onMessage);
  return () => navigator.serviceWorker.removeEventListener("message", onMessage);
}

function resolveFcmRedirectUrl(data: FcmPushData): string {
  return resolveFcmNavigationPath(data, readStoredActiveRole() ?? "buyer");
}

async function registerMessagingServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register(
      `${FCM_SW_PATH}?v=${FCM_SW_VERSION}`,
      {
        scope: "/",
        updateViaCache: "none",
      }
    );
    void registration.update();

    // If a waiting worker exists, activate it now.
    if (registration.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }
    registration.addEventListener("updatefound", () => {
      const sw = registration.installing;
      if (!sw) return;
      sw.addEventListener("statechange", () => {
        if (sw.state === "installed" && navigator.serviceWorker.controller) {
          sw.postMessage({ type: "SKIP_WAITING" });
        }
      });
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

  if (!("Notification" in window)) return cached;

  let permission = Notification.permission;
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }
  if (permission !== "granted") return "";

  if (!isFirebaseConfigured() || !FIREBASE_VAPID_KEY) return cached;

  try {
    const messaging = await getFirebaseMessaging();
    if (!messaging) return cached;

    const registration = await registerMessagingServiceWorker();

    const token = await getToken(messaging, {
      vapidKey: FIREBASE_VAPID_KEY,
      ...(registration ? { serviceWorkerRegistration: registration } : {}),
    });

    const trimmed = token?.trim() || "";
    if (trimmed) {
      localStorage.setItem(FCM_TOKEN_STORAGE_KEY, trimmed);
      return trimmed;
    }

    return cached;
  } catch {
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
  if (!isFirebaseConfigured()) return () => {};

  await getFcmToken();

  const messaging = await getFirebaseMessaging();
  if (!messaging) return () => {};

  return onMessage(messaging, (payload) => {
    handler(payload);
  });
}
