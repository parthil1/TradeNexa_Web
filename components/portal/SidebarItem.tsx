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
  const accentIcon = isSeller ? "text-orange-300" : "text-sky-300";
  const badgeClass =
    "bg-sky-400 text-white shadow-none ring-2 ring-[#0d1b2a]";

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={`group relative flex h-11 items-center rounded-lg text-[13.5px] tracking-[-0.01em] transition-colors duration-200 ${
        collapsed ? "justify-center px-0" : "gap-3 px-3"
      } ${
        active
          ? "bg-white/[0.08] font-medium text-white"
          : "font-normal text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
      }`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center transition-colors duration-200 ${
          active ? accentIcon : "text-slate-500 group-hover:text-slate-300"
        }`}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
      </span>

      {!collapsed ? (
        <>
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          {item.badge ? (
            <ConversationBadge count={item.badge} className={badgeClass} />
          ) : null}
        </>
      ) : item.badge ? (
        <span
          className={`absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums ${badgeClass}`}
          aria-label={`${item.badge} unread message${item.badge === 1 ? "" : "s"}`}
        >
          {formatChatBadgeCount(item.badge)}
        </span>
      ) : null}
    </Link>
  );
}
