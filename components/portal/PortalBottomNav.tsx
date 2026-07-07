"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

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
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#E0E6ED] bg-white/95 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_24px_-8px_rgba(13,27,42,0.12)] backdrop-blur-md sm:px-2 lg:hidden">
      <div className="mx-auto flex max-w-2xl items-stretch justify-around">
        {items.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex min-w-0 flex-1 flex-col items-center gap-0.5 px-0.5 py-2 text-[10px] font-semibold transition-colors sm:px-1 sm:py-2.5 ${
                active ? "text-[#1565C0]" : "text-[#B0BEC5]"
              }`}
            >
              <span
                className={`relative flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                  active ? "bg-[#E8EFF9]" : ""
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 2} />
                {item.badge ? (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF6D00] px-1 text-[9px] font-bold text-white">
                    {item.badge}
                  </span>
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
