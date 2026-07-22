"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  coalesceIncomingSocketPayload,
  connectChatSocket,
  emitNotificationGetUnreadCount,
  emitNotificationMarkAllRead,
  emitNotificationMarkRead,
  getChatSocketStatus,
  subscribeChatEvent,
  subscribeChatSocketStatus,
  unwrapSocketPayload,
} from "@/services/chatSocket";
import {
  fetchNotificationUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notificationService";
import {
  extractNotificationFromSocketPayload,
  isMarkAllUpdatedPayload,
  parseUnreadCountPayload,
} from "@/utils/notificationHelpers";
import type { AppNotification } from "@/types/notifications";

type InboxListener = (event: {
  kind: "new" | "updated" | "mark_all";
  notification?: AppNotification;
}) => void;

interface NotificationContextValue {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  markRead: (id: number) => Promise<AppNotification | null>;
  markAllRead: () => Promise<number>;
  /** Subscribe to live inbox row changes (list pages). */
  subscribeInbox: (listener: InboxListener) => () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

const inboxListeners = new Set<InboxListener>();

function notifyInboxListeners(event: Parameters<InboxListener>[0]) {
  inboxListeners.forEach((listener) => {
    try {
      listener(event);
    } catch {
      /* ignore subscriber errors */
    }
  });
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    if (getChatSocketStatus() === "connected") {
      emitNotificationGetUnreadCount();
    }
    try {
      const { unread_count } = await fetchNotificationUnreadCount();
      setUnreadCount(unread_count);
    } catch {
      /* badge is best-effort */
    }
  }, [isAuthenticated]);

  const markRead = useCallback(
    async (id: number): Promise<AppNotification | null> => {
      if (!Number.isFinite(id) || id <= 0) return null;
      // Optimistic badge update; socket/REST will reconcile.
      setUnreadCount((prev) => Math.max(0, prev - 1));
      emitNotificationMarkRead(id);
      try {
        const notification = await markNotificationRead(id);
        notifyInboxListeners({ kind: "updated", notification });
        return notification;
      } catch {
        void refreshUnreadCount();
        return null;
      }
    },
    [refreshUnreadCount]
  );

  const markAllRead = useCallback(async (): Promise<number> => {
    setUnreadCount(0);
    emitNotificationMarkAllRead();
    try {
      const { updated } = await markAllNotificationsRead();
      notifyInboxListeners({ kind: "mark_all" });
      return updated;
    } catch {
      void refreshUnreadCount();
      return 0;
    }
  }, [refreshUnreadCount]);

  const subscribeInbox = useCallback((listener: InboxListener) => {
    inboxListeners.add(listener);
    return () => {
      inboxListeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    connectChatSocket();
    void refreshUnreadCount();

    const unsubStatus = subscribeChatSocketStatus((next) => {
      if (next === "connected") {
        emitNotificationGetUnreadCount();
      }
    });

    const onUnreadCount = (...args: unknown[]) => {
      const payload = unwrapSocketPayload(coalesceIncomingSocketPayload(args));
      const count = parseUnreadCountPayload(payload);
      if (count != null) setUnreadCount(count);
    };

    const onNew = (...args: unknown[]) => {
      const payload = unwrapSocketPayload(coalesceIncomingSocketPayload(args));
      const notification = extractNotificationFromSocketPayload(payload);
      if (notification) {
        notifyInboxListeners({ kind: "new", notification });
      }
      // Badge: prefer `notification:unread_count` (emitted with new) — no local bump.
    };

    const onUpdated = (...args: unknown[]) => {
      const payload = unwrapSocketPayload(coalesceIncomingSocketPayload(args));
      if (isMarkAllUpdatedPayload(payload)) {
        setUnreadCount(0);
        notifyInboxListeners({ kind: "mark_all" });
        return;
      }
      const notification = extractNotificationFromSocketPayload(payload);
      if (notification) {
        notifyInboxListeners({ kind: "updated", notification });
      }
    };

    const unsubCount = subscribeChatEvent("notification:unread_count", onUnreadCount);
    const unsubNew = subscribeChatEvent("notification:new", onNew);
    const unsubUpdated = subscribeChatEvent("notification:updated", onUpdated);

    return () => {
      unsubStatus();
      unsubCount();
      unsubNew();
      unsubUpdated();
    };
  }, [isAuthenticated, refreshUnreadCount]);

  const value = useMemo(
    () => ({
      unreadCount,
      refreshUnreadCount,
      markRead,
      markAllRead,
      subscribeInbox,
    }),
    [unreadCount, refreshUnreadCount, markRead, markAllRead, subscribeInbox]
  );

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return ctx;
}