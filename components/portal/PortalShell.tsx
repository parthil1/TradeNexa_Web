"use client";

import React, { useState } from "react";
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <PortalAuthGuard>
      <div className="flex min-h-dvh bg-slate-50 text-portal-fg">
        <PortalSidebar
          items={navItems}
          brand={brand}
          accent={topBar.accent}
          mobileOpen={mobileNavOpen}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
          onMobileClose={() => setMobileNavOpen(false)}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <PortalTopBar
            {...topBar}
            onMenuClick={() => setMobileNavOpen(true)}
          />
          <main className="flex-1 pb-24 lg:pb-8">
            {children}
          </main>
          <PortalBottomNav items={navItems} />
        </div>
      </div>
    </PortalAuthGuard>
  );
}
