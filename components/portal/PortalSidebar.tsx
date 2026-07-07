"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PortalNavItem } from "@/components/portal/PortalBottomNav";

interface PortalSidebarProps {
  items: PortalNavItem[];
  brand: { title: string; subtitle: string; href: string };
}

export default function PortalSidebar({ items, brand }: PortalSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden h-dvh w-64 shrink-0 flex-col overflow-hidden border-r border-[#E0E6ED] bg-white lg:flex">
      <div className="shrink-0 border-b border-[#E0E6ED] px-5 py-6">
        <Link href={brand.href} className="block">
          <p className="text-xs font-bold uppercase tracking-wider text-[#FF6D00]">{brand.subtitle}</p>
          <p className="mt-1 text-lg font-extrabold text-[#0D1B2A]">{brand.title}</p>
        </Link>
      </div>
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                active
                  ? "bg-[#E8EFF9] text-[#1565C0]"
                  : "text-[#546E7A] hover:bg-[#F4F6F9] hover:text-[#0D1B2A]"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.25 : 2} />
              <span className="flex-1">{item.label}</span>
              {item.badge ? (
                <span className="rounded-full bg-[#FF6D00] px-2 py-0.5 text-[10px] font-bold text-white">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="shrink-0 border-t border-[#E0E6ED] p-4">
        <Link
          href="/"
          className="flex items-center justify-center rounded-xl border border-[#E0E6ED] px-3 py-2 text-xs font-semibold text-[#546E7A] transition hover:border-[#1565C0] hover:text-[#1565C0]"
        >
          Back to Website
        </Link>
      </div>
    </aside>
  );
}
