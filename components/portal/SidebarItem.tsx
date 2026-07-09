"use client";

import React from "react";
import Link from "next/link";
import type { PortalNavItem } from "@/components/portal/PortalBottomNav";

interface SidebarItemProps {
  item: PortalNavItem;
  active: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
}

export default function SidebarItem({
  item,
  active,
  collapsed = false,
  onNavigate,
}: SidebarItemProps) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={`group relative flex h-10 items-center rounded-lg text-[13px] transition-all duration-200 ${
        collapsed ? "justify-center px-0" : "gap-3 px-3"
      } ${
        active
          ? "bg-slate-800 font-medium text-white"
          : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
      }`}
    >
      {active ? (
        <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r bg-blue-500" />
      ) : null}

      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center transition-colors duration-200 ${
          active ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"
        }`}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.25 : 2} />
      </span>

      {!collapsed ? (
        <>
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          {item.badge ? (
            <span className="rounded-full bg-blue-500 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-white">
              {item.badge}
            </span>
          ) : null}
        </>
      ) : item.badge ? (
        <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-blue-500" />
      ) : null}
    </Link>
  );
}
