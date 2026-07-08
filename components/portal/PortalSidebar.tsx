"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Globe, X } from "lucide-react";
import type { PortalNavItem } from "@/components/portal/PortalBottomNav";
import SidebarItem from "@/components/portal/SidebarItem";

interface PortalSidebarProps {
  items: PortalNavItem[];
  brand: { title: string; subtitle: string; href: string };
  accent?: "buyer" | "seller";
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function SidebarBrand({
  brand,
  accent,
  onNavigate,
}: {
  brand: { title: string; subtitle: string; href: string };
  accent?: "buyer" | "seller";
  onNavigate?: () => void;
}) {
  const isSeller = accent === "seller";

  return (
    <div className="shrink-0 border-b border-white/[0.08] px-5 py-6">
      <Link
        href={brand.href}
        onClick={onNavigate}
        className="flex flex-col items-center gap-3 transition-opacity duration-200 hover:opacity-90"
      >
        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-portal-border/20">
          <Image
            src="/tradenexa-logo.png"
            alt="TradeNexa"
            width={600}
            height={600}
            priority
            className="h-8 w-auto max-w-[40px] object-contain object-center mix-blend-darken [clip-path:inset(0_0_24%_0)]"
          />
        </div>
        <span
          className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
            isSeller
              ? "bg-portal-seller-light/10 text-portal-seller-light ring-1 ring-portal-seller/20"
              : "bg-portal-buyer-light/10 text-portal-buyer-light ring-1 ring-portal-buyer/20"
          }`}
        >
          {isSeller ? "Seller" : "Buyer"}
        </span>
      </Link>
    </div>
  );
}

function SidebarNav({
  items,
  pathname,
  accent,
  onNavigate,
}: {
  items: PortalNavItem[];
  pathname: string;
  accent?: "buyer" | "seller";
  onNavigate?: () => void;
}) {
  return (
    <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
      <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        Menu
      </p>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.href}>
            <SidebarItem
              item={item}
              active={item.match(pathname)}
              accent={accent}
              onNavigate={onNavigate}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SidebarFooter({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="shrink-0 border-t border-white/[0.08] p-3">
      <Link
        href="/"
        onClick={onNavigate}
        className="group flex h-10 items-center gap-3 rounded-xl px-3 text-[13px] font-medium text-slate-400 transition-all duration-200 hover:bg-white/[0.05] hover:text-slate-200"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors group-hover:text-slate-300">
          <Globe className="h-[18px] w-[18px]" />
        </span>
        <span className="flex-1">Back to Website</span>
      </Link>
    </div>
  );
}

function SidebarPanel({
  items,
  brand,
  pathname,
  accent,
  onNavigate,
  onClose,
  showClose,
}: {
  items: PortalNavItem[];
  brand: { title: string; subtitle: string; href: string };
  pathname: string;
  accent?: "buyer" | "seller";
  onNavigate?: () => void;
  onClose?: () => void;
  showClose?: boolean;
}) {
  return (
    <div className="flex h-full flex-col">
      {showClose ? (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors duration-200 hover:bg-white/[0.06] hover:text-white lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}

      <SidebarBrand brand={brand} accent={accent} onNavigate={onNavigate} />
      <SidebarNav items={items} pathname={pathname} accent={accent} onNavigate={onNavigate} />
      <SidebarFooter onNavigate={onNavigate} />
    </div>
  );
}

const sidebarShell =
  "relative flex h-dvh w-[260px] shrink-0 flex-col bg-portal-sidebar";

export default function PortalSidebar({
  items,
  brand,
  accent = "buyer",
  mobileOpen = false,
  onMobileClose,
}: PortalSidebarProps) {
  const pathname = usePathname();

  const handleNavigate = () => {
    onMobileClose?.();
  };

  return (
    <>
      <aside className={`hidden border-r border-white/[0.08] lg:flex ${sidebarShell}`}>
        <SidebarPanel items={items} brand={brand} pathname={pathname} accent={accent} />
      </aside>

      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-portal-fg/40 backdrop-blur-[2px] lg:hidden"
              onClick={onMobileClose}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 36 }}
              className={`fixed inset-y-0 left-0 z-50 border-r border-white/[0.08] shadow-xl shadow-portal-fg/20 lg:hidden ${sidebarShell}`}
            >
              <SidebarPanel
                items={items}
                brand={brand}
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
