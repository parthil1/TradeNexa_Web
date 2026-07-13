"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import ConversationBadge from "@/components/chat/ConversationBadge";

export interface PortalNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
  badge?: number;
}

interface PortalBottomNavProps {
  items: PortalNavItem[];
  accent?: "buyer" | "seller";
}

export default function PortalBottomNav({ items, accent = "buyer" }: PortalBottomNavProps) {
  const pathname = usePathname();
  const isSeller = accent === "seller";
  const activeColor = isSeller ? "text-portal-seller" : "text-portal-buyer";
  const activeBg = isSeller ? "bg-portal-seller-light" : "bg-portal-buyer-light";

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-portal-border bg-white/95 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_24px_-8px_rgba(13,27,42,0.08)] backdrop-blur-xl sm:px-2 lg:hidden">
      <div className="mx-auto flex max-w-2xl items-stretch justify-around">
        {items.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex min-w-0 flex-1 flex-col items-center gap-0.5 px-0.5 py-2 text-[10px] font-medium transition-colors duration-200 sm:px-1 sm:py-2.5 ${
                active ? activeColor : "text-muted-fg"
              }`}
            >
              <span
                className={`relative flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 ${
                  active ? activeBg : ""
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 2} aria-hidden />
                {item.badge ? (
                  <ConversationBadge
                    count={item.badge}
                    className="absolute -right-0.5 -top-0.5"
                  />
                ) : null}
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
