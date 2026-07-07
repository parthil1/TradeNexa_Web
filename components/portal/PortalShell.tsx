"use client";

import React from "react";
import PortalAuthGuard from "@/components/portal/PortalAuthGuard";
import PortalBottomNav, { type PortalNavItem } from "@/components/portal/PortalBottomNav";
import PortalSidebar from "@/components/portal/PortalSidebar";
import PortalTopBar from "@/components/portal/PortalTopBar";

interface PortalShellProps {
  children: React.ReactNode;
  navItems: PortalNavItem[];
  brand: { title: string; subtitle: string; href: string };
  topBar: { title: string; subtitle?: string; accent?: "buyer" | "seller" };
}

export default function PortalShell({ children, navItems, brand, topBar }: PortalShellProps) {
  return (
    <PortalAuthGuard>
      <div className="flex h-dvh overflow-hidden bg-[#F4F6F9] text-[#0D1B2A]">
        <PortalSidebar items={navItems} brand={brand} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <PortalTopBar {...topBar} />
          <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-24 lg:pb-6">
            {children}
          </main>
          <PortalBottomNav items={navItems} />
        </div>
      </div>
    </PortalAuthGuard>
  );
}
