"use client";

import React, { useCallback, useEffect, useMemo, useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck, Loader2 } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import PortalEmptyState from "@/components/portal/PortalEmptyState";
import PortalPagination from "@/components/portal/PortalPagination";
import { Button } from "@/components/common/Button";
import { portalFilterChipClass } from "@/components/portal/portalLayout";
import { useActiveRole } from "@/context/ActiveRoleContext";
import { useNotifications } from "@/context/NotificationContext";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { fetchNotifications, markNotificationRead, markNotificationsRead } from "@/services/notificationService";
import {
  formatNotificationTime,
  resolveNotificationPath,
} from "@/utils/notificationHelpers";
import { recipientPortalForType } from "@/utils/fcmNavigation";
import { getPortalForPath } from "@/utils/roleNavigation";
import type { AppNotification } from "@/types/notifications";

function notificationMatchesRole(
  notification: AppNotification,
  role: "buyer" | "seller"
): boolean {
  const fromData = notification.data?.role;
  if (fromData === "buyer" || fromData === "seller") {
    return fromData === role;
  }
  const status =
    typeof notification.data?.status === "string"
      ? notification.data.status
      : undefined;
  return recipientPortalForType(notification.type, status) === role;
}

/** Merge PATCH /notifications/:id/read updates without wiping list fields. */
function mergeReadUpdate(
  existing: AppNotification,
  incoming: AppNotification
): AppNotification {
  return {
    ...existing,
    ...incoming,
    title: incoming.title?.trim() ? incoming.title : existing.title,
    body: incoming.body?.trim() ? incoming.body : existing.body,
    type: incoming.type?.trim() ? incoming.type : existing.type,
    click_action: incoming.click_action ?? existing.click_action,
    data: incoming.data ?? existing.data,
    reference_id: incoming.reference_id ?? existing.reference_id,
    sender_id: incoming.sender_id ?? existing.sender_id,
    created_at: incoming.created_at?.trim() ? incoming.created_at : existing.created_at,
    is_read: true,
    read_at: incoming.read_at ?? existing.read_at ?? new Date().toISOString(),
  };
}

function SelectionCheckbox({
  checked,
  indeterminate = false,
  disabled = false,
  label,
  onChange,
}: {
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={`inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center ${
        disabled ? "cursor-not-allowed opacity-50" : ""
      }`}
    >
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        aria-label={label}
        ref={(el) => {
          if (el) el.indeterminate = indeterminate && !checked;
        }}
        onChange={(e) => onChange(e.target.checked)}
        onClick={(e) => e.stopPropagation()}
      />
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-md border bg-card transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary/25 ${
          checked || indeterminate
            ? "border-primary bg-primary text-white"
            : "border-border"
        }`}
      >
        {checked ? (
          <Check className="h-3.5 w-3.5" aria-hidden />
        ) : indeterminate ? (
          <span className="h-0.5 w-2.5 rounded-full bg-white" aria-hidden />
        ) : null}
      </span>
    </label>
  );
}

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
  const { activeRole, setActiveRole } = useActiveRole();
  const {
    unreadCount,
    markRead,
    markSelectedRead,
    markAllRead,
    subscribeInbox,
    refreshUnreadCount,
  } = useNotifications();
  const [filter, setFilter] = useState<ReadFilter>("all");
  const [markingAll, setMarkingAll] = useState(false);
  const [markingSelected, setMarkingSelected] = useState(false);
  const [openingId, setOpeningId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

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
    setSelectedIds(new Set());
  }, [filter, notificationRole, pagination.page]);

  useEffect(() => {
    void refreshUnreadCount();
  }, [refreshUnreadCount]);

  useEffect(() => {
    return subscribeInbox((event) => {
      if (event.kind === "mark_all") {
        setSelectedIds(new Set());
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
      if (!notificationMatchesRole(notification, notificationRole)) return;

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
      if (notification.is_read) {
        setSelectedIds((prev) => {
          if (!prev.has(notification.id)) return prev;
          const next = new Set(prev);
          next.delete(notification.id);
          return next;
        });
      }
      setItems((prev) => {
        const exists = prev.some((n) => n.id === notification.id);
        if (!exists) return prev;
        if (filter === "unread" && notification.is_read) {
          return prev.filter((n) => n.id !== notification.id);
        }
        if (filter === "read" && !notification.is_read) {
          return prev.filter((n) => n.id !== notification.id);
        }
        return prev.map((n) =>
          n.id === notification.id ? mergeReadUpdate(n, notification) : n
        );
      });
    });
  }, [filter, notificationRole, setItems, subscribeInbox]);

  const selectableUnread = useMemo(
    () => items.filter((n) => !n.is_read),
    [items]
  );

  const selectedUnreadIds = useMemo(
    () => selectableUnread.filter((n) => selectedIds.has(n.id)).map((n) => n.id),
    [selectableUnread, selectedIds]
  );

  const allUnreadSelected =
    selectableUnread.length > 0 &&
    selectableUnread.every((n) => selectedIds.has(n.id));
  const someUnreadSelected =
    !allUnreadSelected && selectableUnread.some((n) => selectedIds.has(n.id));

  function applyLocalRead(notificationIds: number[]) {
    const idSet = new Set(notificationIds);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      notificationIds.forEach((id) => next.delete(id));
      return next;
    });
    setItems((prev) => {
      if (filter === "unread") {
        return prev.filter((n) => !idSet.has(n.id));
      }
      return prev.map((n) =>
        idSet.has(n.id)
          ? {
              ...n,
              is_read: true,
              read_at: n.read_at ?? new Date().toISOString(),
            }
          : n
      );
    });
  }

  function toggleSelected(id: number, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleSelectAllUnread(checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        selectableUnread.forEach((n) => next.add(n.id));
      } else {
        selectableUnread.forEach((n) => next.delete(n.id));
      }
      return next;
    });
  }

  async function handleMarkAll() {
    if (markingAll || unreadCount <= 0) return;
    setMarkingAll(true);
    try {
      await markAllRead();
      setSelectedIds(new Set());
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

  async function handleMarkSelected() {
    if (markingSelected || selectedUnreadIds.length === 0) return;
    setMarkingSelected(true);
    try {
      // Prefer context helper; fall back to REST if Fast Refresh left a stale provider.
      let updated = 0;
      if (typeof markSelectedRead === "function") {
        updated = await markSelectedRead(selectedUnreadIds);
      } else {
        const result = await markNotificationsRead(selectedUnreadIds);
        updated = result.updated;
        void refreshUnreadCount();
      }
      if (updated > 0 || selectedUnreadIds.length > 0) {
        applyLocalRead(selectedUnreadIds);
      }
    } finally {
      setMarkingSelected(false);
    }
  }

  function handleOpen(notification: AppNotification) {
    if (openingId != null || markingSelected) return;
    setOpeningId(notification.id);

    const portalRole =
      activeRole === "seller" || accent === "seller" ? "seller" : "buyer";
    const path = resolveNotificationPath(notification, portalRole);
    const pathPortal = getPortalForPath(path);

    if (!notification.is_read) {
      // Optimistic UI — do not block navigation on the PATCH.
      applyLocalRead([notification.id]);
      void (async () => {
        try {
          if (typeof markRead === "function") {
            await markRead(notification.id);
          } else {
            await markNotificationRead(notification.id);
            void refreshUnreadCount();
          }
        } catch {
          void refreshUnreadCount();
        }
      })();
    }

    if (pathPortal && pathPortal !== activeRole) {
      setActiveRole(pathPortal);
    }

    // Navigate after the click turn so App Router is initialized.
    startTransition(() => {
      try {
        router.push(path);
      } catch {
        window.location.assign(path);
      } finally {
        setOpeningId(null);
      }
    });
  }

  const emptyTitle =
    filter === "unread"
      ? "No unread notifications"
      : filter === "read"
        ? "No read notifications"
        : "You're all caught up";
  const emptyDescription =
    filter === "all"
      ? "Updates on RFQs and inquiries will appear here."
      : "Try another filter, or check back later.";

  const busy = markingAll || markingSelected || openingId != null;

  return (
    <div className="mx-auto max-w-xl px-4 py-5 sm:px-6 lg:px-8">
      <PortalPageHeader
        title="Notifications"
        subtitle={
          unreadCount > 0
            ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
            : "RFQ and inquiry updates"
        }
        action={
          unreadCount > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={markingAll || markingSelected}
              onClick={() => void handleMarkAll()}
              className="inline-flex items-center gap-1.5"
            >
              {markingAll ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                <CheckCheck className="h-3.5 w-3.5" aria-hidden />
              )}
              Mark all as read
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

      {!loading && !error && selectableUnread.length > 0 ? (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <SelectionCheckbox
              checked={allUnreadSelected}
              indeterminate={someUnreadSelected}
              disabled={busy}
              label="Select all unread notifications on this page"
              onChange={toggleSelectAllUnread}
            />
            <p className="text-xs text-muted-fg sm:text-sm">
              {selectedUnreadIds.length > 0
                ? `${selectedUnreadIds.length} notification${
                    selectedUnreadIds.length === 1 ? "" : "s"
                  } selected`
                : "Select unread notifications"}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy || selectedUnreadIds.length === 0}
            onClick={() => void handleMarkSelected()}
            className="inline-flex shrink-0 items-center gap-1.5"
          >
            {markingSelected ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <Check className="h-3.5 w-3.5" aria-hidden />
            )}
            Mark as read
          </Button>
        </div>
      ) : null}

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
            const rowBusy = openingId === n.id;
            const isUnread = !n.is_read;
            const isSelected = selectedIds.has(n.id);
            return (
              <div
                key={n.id}
                className={`surface-card flex w-full items-stretch border-l-[3px] transition-colors duration-200 ${
                  isUnread
                    ? "border-l-primary bg-primary/[0.04] hover:bg-primary/[0.07]"
                    : "border-l-transparent hover:bg-muted/30"
                } ${isSelected ? "ring-1 ring-primary/25" : ""} ${
                  rowBusy ? "opacity-60" : ""
                }`}
              >
                <div className="flex shrink-0 items-start py-3 pl-3">
                  {isUnread ? (
                    <SelectionCheckbox
                      checked={isSelected}
                      disabled={busy}
                      label={`Select notification: ${n.title || n.id}`}
                      onChange={(checked) => toggleSelected(n.id, checked)}
                    />
                  ) : (
                    <span className="inline-flex h-8 w-8" aria-hidden />
                  )}
                </div>

                <button
                  type="button"
                  disabled={rowBusy || markingSelected}
                  onClick={() => void handleOpen(n)}
                  className="min-w-0 flex-1 cursor-pointer py-4 pr-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/25 disabled:cursor-wait"
                >
                  <p
                    className={`text-sm ${
                      isUnread ? "font-semibold text-foreground" : "font-normal text-muted-fg"
                    }`}
                  >
                    {n.title || "Notification"}
                  </p>
                  {n.body ? (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-fg">{n.body}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-muted-fg">
                    {formatNotificationTime(n.created_at)}
                  </p>
                </button>

                {rowBusy ? (
                  <div className="flex shrink-0 items-start p-3 pl-0">
                    <Loader2 className="mt-1 h-4 w-4 animate-spin text-muted-fg" />
                  </div>
                ) : null}
              </div>
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
