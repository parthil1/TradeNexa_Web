"use client";

import React from "react";
import Link from "next/link";
import ConversationBadge, { formatChatBadgeCount } from "@/components/chat/ConversationBadge";
import type { PortalNavItem } from "@/components/portal/PortalBottomNav";

interface SidebarItemProps {
  item: PortalNavItem;
  active: boolean;
  collapsed?: boolean;
  accent?: "buyer" | "seller";
  onNavigate?: () => void;
}

export default function SidebarItem({
  item,
  active,
  collapsed = false,
  accent = "buyer",
  onNavigate,
}: SidebarItemProps) {
  const Icon = item.icon;
  const isSeller = accent === "seller";
  const accentBar = isSeller ? "bg-portal-seller" : "bg-primary";
  const accentIcon = isSeller ? "text-orange-300" : "text-sky-300";

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={`group relative flex h-10 items-center rounded-lg text-[13px] transition-all duration-200 ${
        collapsed ? "justify-center px-0" : "gap-3 px-3"
      } ${
        active
          ? "bg-white/10 font-medium text-white"
          : "text-white/55 hover:bg-white/[0.06] hover:text-white/90"
      }`}
    >
      {active ? (
        <span
          className={`absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r ${accentBar}`}
          aria-hidden
        />
      ) : null}

      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center transition-colors duration-200 ${
          active ? accentIcon : "text-white/40 group-hover:text-white/70"
        }`}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.25 : 2} aria-hidden />
      </span>

      {!collapsed ? (
        <>
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          {item.badge ? (
            <ConversationBadge
              count={item.badge}
              className="bg-sky-400 text-slate-950 shadow-none ring-2 ring-slate-950/40"
            />
          ) : null}
        </>
      ) : item.badge ? (
        <span
          className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-sky-400 px-1 text-[10px] font-bold tabular-nums text-slate-950 ring-2 ring-slate-950/40"
          aria-label={`${item.badge} unread message${item.badge === 1 ? "" : "s"}`}
        >
          {formatChatBadgeCount(item.badge)}
        </span>
      ) : null}
    </Link>
  );
}
