"use client";

import { useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  clearFcmPendingPath,
  getFcmNotificationContent,
  navigateFromFcmNotification,
  readFcmPendingPath,
  subscribeFcmServiceWorkerNavigation,
  subscribeForegroundMessages,
  syncActiveRoleToServiceWorker,
} from "@/services/fcmService";

const RECOVER_MAX_AGE_MS = 60_000;

async function tryRecoverFromRoot(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const onRoot =
    window.location.pathname === "/" || window.location.pathname === "";
  if (!onRoot) return false;

  const best = await readFcmPendingPath();
  if (!best) return false;

  const age = Date.now() - best.at;
  if (age >= RECOVER_MAX_AGE_MS) return false;

  await clearFcmPendingPath();
  window.location.replace(best.path);
  return true;
}

/**
 * Registers the FCM service worker and shows in-app toasts for foreground pushes.
 * Background pushes are handled in /firebase-messaging-sw.js.
 *
 * Do not call `new Notification()` while the tab is visible — Chrome often
 * opens the site origin "/" on that click and races our deep link.
 */
export function FcmListener() {
  useEffect(() => {
    let unsubscribe = () => {};
    let cancelled = false;
    let unsubSwNav = () => {};

    const onMaybeRecover = () => {
      void tryRecoverFromRoot();
    };

    void (async () => {
      if (await tryRecoverFromRoot()) return;
      if (cancelled) return;

      syncActiveRoleToServiceWorker();
      unsubSwNav = subscribeFcmServiceWorkerNavigation();

      window.addEventListener("pageshow", onMaybeRecover);
      window.addEventListener("focus", onMaybeRecover);

      const unsub = await subscribeForegroundMessages((payload) => {
        // OS notifications are owned by the service worker (background) or the
        // browser (notification payloads). Never call `new Notification()` here —
        // that double-fires with the SW when the tab is hidden / multi-tab.
        if (document.visibilityState !== "visible") return;

        const { title, body, url, data } = getFcmNotificationContent(payload);
        // Skip empty pushes (no real title/body — only the TradeNexa fallback).
        const hasTitle =
          Boolean(payload.notification?.title?.trim()) || Boolean(data.title?.trim());
        const hasBody =
          Boolean(payload.notification?.body?.trim()) || Boolean(data.body?.trim());
        if (!hasTitle && !hasBody) return;

        const message = body ? `${title}: ${body}` : title;

        toast(
          (t) => (
            <button
              type="button"
              className="text-left"
              onClick={() => {
                toast.dismiss(t.id);
                navigateFromFcmNotification({ url, data });
              }}
            >
              {message}
              <span className="mt-1 block text-xs opacity-70">Click to open</span>
            </button>
          ),
          {
            duration: 6000,
            position: "top-center",
          }
        );
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
      unsubSwNav();
      window.removeEventListener("pageshow", onMaybeRecover);
      window.removeEventListener("focus", onMaybeRecover);
    };
  }, []);

  return null;
}
