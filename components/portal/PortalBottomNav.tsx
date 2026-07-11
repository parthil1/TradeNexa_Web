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
}

export default function PortalBottomNav({ items }: PortalBottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-portal-border bg-white/90 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_24px_-8px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:px-2 lg:hidden">
      <div className="mx-auto flex max-w-2xl items-stretch justify-around">
        {items.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex min-w-0 flex-1 flex-col items-center gap-0.5 px-0.5 py-2 text-[10px] font-medium transition-colors sm:px-1 sm:py-2.5 ${
                active ? "text-portal-buyer" : "text-slate-400"
              }`}
            >
              <span
                className={`relative flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-150 ${
                  active ? "bg-portal-buyer-light" : ""
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 2} />
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
