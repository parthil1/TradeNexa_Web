"use client";

import { useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  getFcmNotificationContent,
  subscribeForegroundMessages,
} from "@/services/fcmService";

/**
 * Registers the FCM service worker and shows in-app toasts for foreground pushes.
 * Background pushes are handled in /firebase-messaging-sw.js.
 */
export function FcmListener() {
  useEffect(() => {
    let unsubscribe = () => {};
    let cancelled = false;

    void (async () => {
      const unsub = await subscribeForegroundMessages((payload) => {
        const { title, body, url } = getFcmNotificationContent(payload);
        const message = body ? `${title}: ${body}` : title;

        toast(message, {
          duration: 5000,
          position: "top-center",
        });

        if (
          typeof Notification !== "undefined" &&
          Notification.permission === "granted" &&
          document.visibilityState === "visible"
        ) {
          try {
            const n = new Notification(title, {
              body,
              icon: "/favicon-96x96.png",
              data: { url },
            });
            n.onclick = () => {
              window.focus();
              if (url && url !== window.location.pathname) {
                window.location.assign(url);
              }
              n.close();
            };
          } catch {
            // Ignore Notification constructor failures (e.g. unsupported options).
          }
        }
      });

      if (cancelled) {
        unsub();
        return;
      }
      unsubscribe = unsub;
    })();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return null;
}
