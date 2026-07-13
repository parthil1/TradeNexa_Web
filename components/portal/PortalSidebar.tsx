"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Globe, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getInitials } from "@/utils/catalogHelpers";
import type { PortalNavItem } from "@/components/portal/PortalBottomNav";
import SidebarItem from "@/components/portal/SidebarItem";

interface PortalSidebarProps {
  items: PortalNavItem[];
  brand: { title: string; subtitle: string; href: string };
  accent?: "buyer" | "seller";
  mobileOpen?: boolean;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  onMobileClose?: () => void;
}

function SidebarProfile({
  accent,
  collapsed,
  onNavigate,
}: {
  accent?: "buyer" | "seller";
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const { user } = useAuth();
  const isSeller = accent === "seller";
  const displayName = user?.company || user?.name || (isSeller ? "Seller" : "Buyer");
  const initials = getInitials(displayName);
  const badgeClass = isSeller
    ? "text-orange-300 bg-orange-500/15 border-orange-400/25"
    : "text-sky-300 bg-primary/20 border-sky-400/25";

  return (
    <div className="shrink-0 border-b border-white/[0.08] px-4 py-5">
      <Link
        href={isSeller ? "/seller/profile" : "/buyer/profile"}
        onClick={onNavigate}
        className={`flex items-center transition-opacity duration-200 hover:opacity-90 ${
          collapsed ? "justify-center" : "gap-3"
        }`}
        title={collapsed ? displayName : undefined}
      >
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${badgeClass}`}
        >
          {initials}
        </div>
        {!collapsed ? (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{displayName}</p>
            <span
              className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badgeClass}`}
            >
              {isSeller ? "Seller" : "Buyer"}
            </span>
          </div>
        ) : null}
      </Link>
    </div>
  );
}

function SidebarNav({
  items,
  pathname,
  collapsed,
  accent,
  onNavigate,
}: {
  items: PortalNavItem[];
  pathname: string;
  collapsed?: boolean;
  accent?: "buyer" | "seller";
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4">
      {!collapsed ? (
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/35">
          Menu
        </p>
      ) : null}
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.href}>
            <SidebarItem
              item={item}
              active={item.match(pathname)}
              collapsed={collapsed}
              accent={accent}
              onNavigate={onNavigate}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SidebarFooter({
  collapsed,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className="shrink-0 border-t border-white/[0.08] p-3">
      <Link
        href="/"
        onClick={onNavigate}
        title={collapsed ? "Back to Website" : undefined}
        className={`group flex h-10 items-center rounded-lg text-[13px] font-medium text-white/45 transition-all duration-200 hover:bg-white/[0.06] hover:text-white/85 ${
          collapsed ? "justify-center px-0" : "gap-3 px-3"
        }`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center text-white/40 transition-colors group-hover:text-white/70">
          <Globe className="h-[18px] w-[18px]" aria-hidden />
        </span>
        {!collapsed ? <span className="flex-1">Back to Website</span> : null}
      </Link>
    </div>
  );
}

function CollapseToggle({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="hidden shrink-0 border-t border-white/[0.08] p-3 lg:block">
      <button
        type="button"
        onClick={onToggle}
        className={`flex h-10 w-full cursor-pointer items-center rounded-lg text-white/45 transition-all duration-200 hover:bg-white/[0.06] hover:text-white/85 ${
          collapsed ? "justify-center" : "gap-3 px-3"
        }`}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="h-[18px] w-[18px]" aria-hidden />
        ) : (
          <>
            <ChevronLeft className="h-[18px] w-[18px]" aria-hidden />
            <span className="text-[13px] font-medium">Collapse</span>
          </>
        )}
      </button>
    </div>
  );
}

function SidebarPanel({
  items,
  pathname,
  accent,
  collapsed,
  onNavigate,
  onClose,
  onCollapsedChange,
  showClose,
}: {
  items: PortalNavItem[];
  pathname: string;
  accent?: "buyer" | "seller";
  collapsed?: boolean;
  onNavigate?: () => void;
  onClose?: () => void;
  onCollapsedChange?: (collapsed: boolean) => void;
  showClose?: boolean;
}) {
  return (
    <div className="flex h-full flex-col bg-navy">
      {showClose ? (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-white/50 transition-colors duration-200 hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      ) : null}

      <SidebarProfile accent={accent} collapsed={collapsed} onNavigate={onNavigate} />
      <SidebarNav
        items={items}
        pathname={pathname}
        collapsed={collapsed}
        accent={accent}
        onNavigate={onNavigate}
      />
      <SidebarFooter collapsed={collapsed} onNavigate={onNavigate} />
      {onCollapsedChange ? (
        <CollapseToggle
          collapsed={collapsed ?? false}
          onToggle={() => onCollapsedChange(!collapsed)}
        />
      ) : null}
    </div>
  );
}

export default function PortalSidebar({
  items,
  brand: _brand,
  accent = "buyer",
  mobileOpen = false,
  collapsed = false,
  onCollapsedChange,
  onMobileClose,
}: PortalSidebarProps) {
  const pathname = usePathname();

  const handleNavigate = () => {
    onMobileClose?.();
  };

  const widthClass = collapsed ? "w-[72px]" : "w-[260px]";

  return (
    <>
      <div
        className={`hidden shrink-0 transition-[width] duration-200 lg:block ${widthClass}`}
        aria-hidden
      />
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-white/[0.08] bg-navy transition-[width] duration-200 lg:flex ${widthClass}`}
      >
        <SidebarPanel
          items={items}
          pathname={pathname}
          accent={accent}
          collapsed={collapsed}
          onCollapsedChange={onCollapsedChange}
        />
      </aside>

      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-navy/40 backdrop-blur-[2px] lg:hidden"
              onClick={onMobileClose}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 36 }}
              className="fixed inset-y-0 left-0 z-50 flex h-dvh w-[260px] shrink-0 flex-col border-r border-white/[0.08] bg-navy shadow-xl lg:hidden"
            >
              <SidebarPanel
                items={items}
                pathname={pathname}
                accent={accent}
                onNavigate={handleNavigate}
                onClose={onMobileClose}
                showClose
              />
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
