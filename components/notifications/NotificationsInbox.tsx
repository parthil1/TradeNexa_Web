"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import PortalEmptyState from "@/components/portal/PortalEmptyState";
import PortalPagination from "@/components/portal/PortalPagination";
import { Button } from "@/components/common/Button";
import { portalFilterChipClass } from "@/components/portal/portalLayout";
import { useActiveRole } from "@/context/ActiveRoleContext";
import { useNotifications } from "@/context/NotificationContext";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { fetchNotifications } from "@/services/notificationService";
import {
  formatNotificationTime,
  resolveNotificationPath,
} from "@/utils/notificationHelpers";
import type { AppNotification } from "@/types/notifications";

type ReadFilter = "all" | "unread" | "read";

const PAGE_SIZE = 20;

const FILTERS: { id: ReadFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "read", label: "Read" },
];

interface NotificationsInboxProps {
  accent?: "buyer" | "seller";
}

export default function NotificationsInbox({ accent = "buyer" }: NotificationsInboxProps) {
  const router = useRouter();
  const { activeRole } = useActiveRole();
  const { unreadCount, markRead, markAllRead, subscribeInbox, refreshUnreadCount } =
    useNotifications();
  const [filter, setFilter] = useState<ReadFilter>("all");
  const [markingAll, setMarkingAll] = useState(false);
  const [openingId, setOpeningId] = useState<number | null>(null);

  const isReadParam =
    filter === "unread" ? false : filter === "read" ? true : undefined;

  const notificationRole =
    activeRole === "seller" || accent === "seller" ? "seller" : "buyer";

  const fetchPage = useCallback(
    (page: number) =>
      fetchNotifications({
        page,
        limit: PAGE_SIZE,
        is_read: isReadParam,
        role: notificationRole,
      }),
    [isReadParam, notificationRole]
  );

  const { items, setItems, pagination, loading, error, goToPage, reload } = usePaginatedList({
    fetchPage,
    resetDeps: [filter, notificationRole],
  });

  useEffect(() => {
    void refreshUnreadCount();
  }, [refreshUnreadCount]);

  useEffect(() => {
    return subscribeInbox((event) => {
      if (event.kind === "mark_all") {
        if (filter === "unread") {
          setItems([]);
          return;
        }
        setItems((prev) =>
          prev.map((n) =>
            n.is_read
              ? n
              : {
                  ...n,
                  is_read: true,
                  read_at: n.read_at ?? new Date().toISOString(),
                }
          )
        );
        return;
      }

      const notification = event.notification;
      if (!notification) return;

      if (event.kind === "new") {
        if (filter === "read" && !notification.is_read) return;
        if (filter === "unread" && notification.is_read) return;
        setItems((prev) => {
          if (prev.some((n) => n.id === notification.id)) {
            return prev.map((n) => (n.id === notification.id ? notification : n));
          }
          return [notification, ...prev];
        });
        return;
      }

      // updated
      setItems((prev) => {
        const exists = prev.some((n) => n.id === notification.id);
        if (!exists) return prev;
        if (filter === "unread" && notification.is_read) {
          return prev.filter((n) => n.id !== notification.id);
        }
        if (filter === "read" && !notification.is_read) {
          return prev.filter((n) => n.id !== notification.id);
        }
        return prev.map((n) => (n.id === notification.id ? { ...n, ...notification } : n));
      });
    });
  }, [filter, setItems, subscribeInbox]);

  async function handleMarkAll() {
    if (markingAll || unreadCount <= 0) return;
    setMarkingAll(true);
    try {
      await markAllRead();
      if (filter === "unread") {
        setItems([]);
      } else {
        setItems((prev) =>
          prev.map((n) => ({
            ...n,
            is_read: true,
            read_at: n.read_at ?? new Date().toISOString(),
          }))
        );
      }
    } finally {
      setMarkingAll(false);
    }
  }

  async function handleOpen(notification: AppNotification) {
    if (openingId != null) return;
    setOpeningId(notification.id);
    try {
      if (!notification.is_read) {
        await markRead(notification.id);
        setItems((prev) => {
          if (filter === "unread") {
            return prev.filter((n) => n.id !== notification.id);
          }
          return prev.map((n) =>
            n.id === notification.id
              ? { ...n, is_read: true, read_at: n.read_at ?? new Date().toISOString() }
              : n
          );
        });
      }
      const path = resolveNotificationPath(
        notification,
        activeRole === "seller" || accent === "seller" ? "seller" : "buyer"
      );
      router.push(path);
    } finally {
      setOpeningId(null);
    }
  }

  const emptyTitle =
    filter === "unread"
      ? "No unread notifications"
      : filter === "read"
        ? "No read notifications"
        : "All caught up";
  const emptyDescription =
    filter === "all"
      ? "RFQ and inquiry updates will show up here."
      : "Try another filter or check back later.";

  return (
    <div className="mx-auto max-w-xl px-4 py-5 sm:px-6 lg:px-8">
      <PortalPageHeader
        title="Notifications"
        subtitle={
          unreadCount > 0
            ? `${unreadCount} unread`
            : "RFQ & inquiry inbox"
        }
        action={
          unreadCount > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={markingAll}
              onClick={() => void handleMarkAll()}
              className="inline-flex items-center gap-1.5"
            >
              {markingAll ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                <CheckCheck className="h-3.5 w-3.5" aria-hidden />
              )}
              Mark all read
            </Button>
          ) : null
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={portalFilterChipClass(filter === tab.id)}
          >
            {tab.label}
            {tab.id === "unread" && unreadCount > 0 ? (
              <span className="ml-1.5 text-[11px] font-semibold tabular-nums">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-fg">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          Loading notifications…
        </div>
      ) : error ? (
        <div className="surface-card space-y-3 p-5 text-center">
          <p className="text-sm text-error">{error}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => reload()}>
            Try again
          </Button>
        </div>
      ) : items.length === 0 ? (
        <PortalEmptyState icon={Bell} title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="space-y-2">
          {items.map((n) => {
            const busy = openingId === n.id;
            const isUnread = !n.is_read;
            return (
              <button
                key={n.id}
                type="button"
                disabled={busy}
                onClick={() => void handleOpen(n)}
                className={`surface-card w-full cursor-pointer border-l-[3px] p-4 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 disabled:cursor-wait ${
                  isUnread
                    ? "border-l-primary bg-primary/[0.04] hover:bg-primary/[0.07]"
                    : "border-l-transparent hover:bg-muted/30"
                } ${busy ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className={`text-sm ${
                        isUnread ? "font-semibold text-foreground" : "font-normal text-muted-fg"
                      }`}
                    >
                      {n.title || "Notification"}
                    </p>
                    {n.body ? (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-fg">
                        {n.body}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-muted-fg">
                      {formatNotificationTime(n.created_at)}
                    </p>
                  </div>
                  {busy ? (
                    <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-muted-fg" />
                  ) : isUnread ? (
                    <span
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
                      aria-hidden
                    />
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {!loading && !error && pagination.totalPages > 1 ? (
        <div className="mt-5">
          <PortalPagination
            pagination={pagination}
            onPageChange={goToPage}
            loading={loading}
            itemLabel="notifications"
            compact
          />
        </div>
      ) : null}
    </div>
  );
}