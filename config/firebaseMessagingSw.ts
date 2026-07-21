/** Shared Firebase messaging service-worker source (background receive + click). */
import { buildFcmNavigationSwHelpersSource } from "@/utils/fcmNavigation";

export function buildFirebaseMessagingSwSource(config: Record<string, string>): string {
  // Values come from NEXT_PUBLIC_FIREBASE_* via getFirebaseWebConfigFromEnv().
  // They must be inlined into the SW script — browsers cannot read process.env here.
  return `/* Served by /api/firebase-messaging-sw — config from env */
importScripts("https://www.gstatic.com/firebasejs/12.16.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.16.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: ${JSON.stringify(config.apiKey)},
  authDomain: ${JSON.stringify(config.authDomain)},
  projectId: ${JSON.stringify(config.projectId)},
  storageBucket: ${JSON.stringify(config.storageBucket)},
  messagingSenderId: ${JSON.stringify(config.messagingSenderId)},
  appId: ${JSON.stringify(config.appId)},
});
const messaging = firebase.messaging();

// Mirrored from localStorage \`tradenexa_active_role\` — used only for CHAT_MESSAGE clicks.
let cachedActiveRole = "buyer";

${buildFcmNavigationSwHelpersSource()}

function portalFromUrl(url) {
  try {
    var path = new URL(url, self.location.origin).pathname;
    if (path === "/seller" || path.indexOf("/seller/") === 0) return "seller";
    if (path === "/buyer" || path.indexOf("/buyer/") === 0) return "buyer";
  } catch (e) {}
  return null;
}

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "SET_ACTIVE_ROLE" && (data.role === "buyer" || data.role === "seller")) {
    cachedActiveRole = data.role;
  }
});

messaging.onBackgroundMessage((payload) => {
  // Notification payloads are shown by the browser; handle data-only here.
  if (payload.notification) return;

  const data = payload.data || {};
  const title = data.title || "TradeNexa";
  const options = {
    body: data.body || "",
    icon: data.icon || "/favicon-96x96.png",
    data: {
      ...data,
      url: resolveFcmNavigationPath(data, cachedActiveRole),
    },
  };
  return self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const pushData = event.notification?.data || {};
  const targetUrl = resolveFcmNavigationPath(pushData, cachedActiveRole);
  const role = portalFromUrl(targetUrl);

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        // Page applies role to localStorage then navigates (SW cannot write localStorage).
        client.postMessage({ type: "FCM_NAVIGATE", url: targetUrl, role: role });
        if ("focus" in client) return client.focus();
        return undefined;
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
`;
}

export function getFirebaseWebConfigFromEnv(): Record<string, string> {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  };
}