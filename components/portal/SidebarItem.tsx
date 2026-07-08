"use client";

import React from "react";
import Link from "next/link";
import type { PortalNavItem } from "@/components/portal/PortalBottomNav";

interface SidebarItemProps {
  item: PortalNavItem;
  active: boolean;
  accent?: "buyer" | "seller";
  onNavigate?: () => void;
}

export default function SidebarItem({ item, active, accent = "buyer", onNavigate }: SidebarItemProps) {
  const Icon = item.icon;
  const isSeller = accent === "seller";

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`group relative flex h-10 items-center gap-3 rounded-xl px-3 text-[13px] font-medium transition-all duration-200 ${
        active
          ? isSeller
            ? "bg-portal-seller-light/10 text-white"
            : "bg-portal-buyer-light/10 text-white"
          : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
      }`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-200 ${
          active
            ? isSeller
              ? "bg-portal-seller-light/15 text-portal-seller-light"
              : "bg-portal-buyer-light/15 text-portal-buyer-light"
            : "text-slate-500 group-hover:text-slate-300"
        }`}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.25 : 2} />
      </span>

      <span className="min-w-0 flex-1 truncate">{item.label}</span>

      {item.badge ? (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-portal-seller px-1.5 text-[10px] font-semibold tabular-nums text-white">
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}
