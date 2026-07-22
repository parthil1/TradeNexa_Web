"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Bell, Globe, Heart, LogOut, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/hooks/useWishlist";
import { useActiveRole } from "@/context/ActiveRoleContext";
import { useNotifications } from "@/context/NotificationContext";
import { Logo } from "@/components/common/Logo";
import PortalTooltip from "@/components/portal/PortalTooltip";

interface PortalTopBarProps {
  title: string;
  subtitle?: string;
  accent?: "buyer" | "seller";
  onMenuClick?: () => void;
}

export default function PortalTopBar({
  title: _title,
  subtitle: _subtitle,
  accent = "buyer",
  onMenuClick,
}: PortalTopBarProps) {
  const router = useRouter();
  const { logoutUser } = useAuth();
  const { wishlistTotal } = useWishlist();
  const { unreadCount } = useNotifications();
  const { canSwitchRole, activeRole, setActiveRole } = useActiveRole();
  const isSeller = accent === "seller" || activeRole === "seller";
  const hoverAccent = isSeller
    ? "hover:border-portal-seller hover:text-portal-seller"
    : "hover:border-portal-buyer hover:text-portal-buyer";
  const notificationsHref =
    activeRole === "seller" ? "/seller/notifications" : "/buyer/notifications";

  function switchRole() {
    const next = activeRole === "buyer" ? "seller" : "buyer";
    setActiveRole(next);
    router.push(next === "seller" ? "/seller/dashboard" : "/buyer/home");
  }

  return (
    <header className="sticky top-0 z-40 shrink-0 border-b border-portal-border bg-card/95 backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-portal-border text-muted-fg transition-colors duration-200 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>
          <Logo size="nav" href={activeRole === "seller" ? "/seller/dashboard" : "/buyer/home"} />
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          <PortalTooltip label="Back to Website">
            <Link
              href="/"
              className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-portal-border px-2.5 text-muted-fg transition-colors duration-200 sm:px-3 lg:hidden ${hoverAccent}`}
              aria-label="Back to Website"
            >
              <Globe className="h-4 w-4 shrink-0" aria-hidden />
              <span className="hidden text-xs font-medium sm:inline">Website</span>
            </Link>
          </PortalTooltip>

          {canSwitchRole ? (
            <PortalTooltip label={activeRole === "buyer" ? "Switch to Seller" : "Switch to Buyer"}>
              <button
                type="button"
                onClick={switchRole}
                className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-portal-border px-2.5 text-xs font-medium text-muted-fg transition-colors duration-200 sm:px-3 ${hoverAccent}`}
              >
                <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden />
                <span className="hidden sm:inline">
                  {activeRole === "buyer" ? "Switch to Seller" : "Switch to Buyer"}
                </span>
              </button>
            </PortalTooltip>
          ) : null}

          {activeRole === "buyer" ? (
            <PortalTooltip label={wishlistTotal > 0 ? `Wishlist (${wishlistTotal})` : "Wishlist"}>
              <Link
                href="/buyer/wishlist"
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-fg transition-colors duration-200 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
                aria-label={`Wishlist${wishlistTotal > 0 ? `, ${wishlistTotal} saved` : ""}`}
              >
                <Heart className="h-5 w-5" strokeWidth={2} aria-hidden />
                {wishlistTotal > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-white">
                    {wishlistTotal > 9 ? "9+" : wishlistTotal}
                  </span>
                ) : null}
              </Link>
            </PortalTooltip>
          ) : null}

          <PortalTooltip
            label={
              unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"
            }
          >
            <Link
              href={notificationsHref}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-fg transition-colors duration-200 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
              aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
            >
              <Bell className="h-5 w-5" aria-hidden />
              {unreadCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </Link>
          </PortalTooltip>

          <PortalTooltip label="Sign out">
            <button
              type="button"
              onClick={() => {
                void logoutUser().then(() => router.replace("/"));
              }}
              className="hidden h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-muted-fg transition-colors duration-200 hover:bg-error-soft hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 sm:flex"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" aria-hidden />
            </button>
          </PortalTooltip>
        </div>
      </div>
    </header>
  );
}
