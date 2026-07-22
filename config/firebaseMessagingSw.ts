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
// Last deep link from a push — used when Windows/Chrome click has empty notification.data.
let lastResolvedPath = "";

// Force this SW version to activate immediately (busts stuck old workers).
self.addEventListener("install", function (event) {
  self.skipWaiting();
});
self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});

${buildFcmNavigationSwHelpersSource()}

var FCM_PENDING_CACHE = "tradenexa-fcm";
var FCM_PENDING_URL = "/__fcm_pending_nav";

function normalizePushData(raw) {
  raw = raw || {};
  var out = {};
  var fcmMsg = raw.FCM_MSG || raw.fcm_msg;
  if (typeof fcmMsg === "string") {
    try {
      var parsed = JSON.parse(fcmMsg);
      if (parsed && parsed.data && typeof parsed.data === "object") {
        for (var nk in parsed.data) out[nk] = String(parsed.data[nk]);
      }
      // Some FCM browser notifications nest fields at the top of FCM_MSG.
      if (parsed && typeof parsed === "object") {
        var keys = ["type", "click_action", "rfq_id", "inquiry_id", "conversation_id", "reference_id", "title", "body", "message_id"];
        for (var i = 0; i < keys.length; i++) {
          var key = keys[i];
          if (parsed[key] != null && out[key] == null) out[key] = String(parsed[key]);
        }
      }
    } catch (e) {}
  }
  for (var k in raw) {
    if (!Object.prototype.hasOwnProperty.call(raw, k)) continue;
    var lower = String(k).toLowerCase();
    // Never navigate from backend deep links / site root.
    if (lower === "url" || lower === "click_url" || lower === "link" || lower === "deep_link") continue;
    if (raw[k] == null) continue;
    out[k] = String(raw[k]);
  }
  return out;
}

async function stampPendingPath(path) {
  if (!path || path === "/") return;
  lastResolvedPath = path;
  try {
    var cache = await caches.open(FCM_PENDING_CACHE);
    await cache.put(
      FCM_PENDING_URL,
      new Response(JSON.stringify({ path: path, at: Date.now() }), {
        headers: { "Content-Type": "application/json" },
      })
    );
  } catch (e) {}
}

async function readPendingPath() {
  try {
    var cache = await caches.open(FCM_PENDING_CACHE);
    var res = await cache.match(FCM_PENDING_URL);
    if (!res) return "";
    var parsed = await res.json();
    return (parsed && parsed.path) || "";
  } catch (e) {
    return "";
  }
}

function broadcastToClients(message) {
  return clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      list[i].postMessage(message);
    }
    return list;
  });
}

async function closeBrowserDuplicateNotifications(keepTag) {
  try {
    var list = await self.registration.getNotifications();
    for (var i = 0; i < list.length; i++) {
      var n = list[i];
      var d = n.data || {};
      // Keep notifications we created (have __path). Close Chrome's auto ones.
      if (!d.__path) {
        try { n.close(); } catch (e) {}
      }
    }
  } catch (e) {}
}

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }
  if (data.type === "SET_ACTIVE_ROLE" && (data.role === "buyer" || data.role === "seller")) {
    cachedActiveRole = data.role;
  }
});

messaging.onBackgroundMessage((payload) => {
  const data = normalizePushData(payload.data || {});
  const path = resolveFcmNavigationPath(data, cachedActiveRole);
  const title =
    (payload.notification && payload.notification.title) || data.title || "TradeNexa";
  const body =
    (payload.notification && payload.notification.body) || data.body || "";
  const tag =
    data.notification_id ||
    data.message_id ||
    ["tradenexa", data.type || "push", data.reference_id || data.rfq_id || data.inquiry_id || data.conversation_id || ""]
      .join("-")
      .slice(0, 120);

  return (async function () {
    await stampPendingPath(path);

    // Ask open pages to mirror path into localStorage (SW cannot write it).
    await broadcastToClients({
      type: "FCM_STAMP",
      path: path,
      at: Date.now(),
    });

    // Always show OUR notification with __path so click is under SW control.
    // Chrome may also paint notification payloads — we close those next.
    await self.registration.showNotification(title, {
      body: body,
      icon: data.icon || "/favicon-96x96.png",
      data: Object.assign({}, data, { __path: path }),
      tag: tag || "tradenexa-fcm",
      renotify: false,
      requireInteraction: false,
    });

    // Drop Chrome auto-notifications that lack __path (they open only "/").
    await closeBrowserDuplicateNotifications(tag);
    setTimeout(function () {
      closeBrowserDuplicateNotifications(tag);
    }, 250);
    setTimeout(function () {
      closeBrowserDuplicateNotifications(tag);
    }, 1000);
  })();
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const pushData = normalizePushData(event.notification?.data || {});
  var syncPath =
    (pushData.__path || "").trim() ||
    resolveFcmNavigationPath(pushData, cachedActiveRole) ||
    lastResolvedPath ||
    "";

  event.waitUntil(
    (async function () {
      var path = syncPath;
      if (!path || path === "/") {
        path = (await readPendingPath()) || lastResolvedPath || "/buyer/notifications";
      }
      if (!path || path === "/") path = "/buyer/notifications";

      const targetUrl = new URL(path, self.location.origin).href;

      // Open deep link FIRST (launches Chrome / new tab). Do not await stamp before this.
      var openPromise =
        typeof clients.openWindow === "function"
          ? clients.openWindow(targetUrl)
          : Promise.resolve(null);

      await stampPendingPath(path);

      const clientList = await broadcastToClients({
        type: "FCM_STAMP",
        path: path,
        at: Date.now(),
      });

      for (var i = 0; i < clientList.length; i++) {
        clientList[i].postMessage({
          type: "FCM_NAVIGATE",
          url: path,
          data: pushData,
          navMode: "openWindow_first",
          skipNavigate: true,
        });
      }

      return openPromise;
    })()
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
