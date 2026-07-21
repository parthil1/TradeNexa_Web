/** Shared Firebase messaging service-worker source (background receive + click). */
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

messaging.onBackgroundMessage((payload) => {
  // Notification payloads are shown by the browser; handle data-only here.
  if (payload.notification) return;

  const title = payload.data?.title || "TradeNexa";
  const options = {
    body: payload.data?.body || "",
    icon: payload.data?.icon || "/favicon-96x96.png",
    data: {
      url: payload.data?.url || payload.fcmOptions?.link || "/",
      ...(payload.data || {}),
    },
  };
  return self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          if ("navigate" in client) client.navigate(targetUrl);
          return client.focus();
        }
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
