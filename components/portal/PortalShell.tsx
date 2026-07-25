"use client";

import React from "react";
import PortalAuthGuard from "@/components/portal/PortalAuthGuard";
import PortalBottomNav, { type PortalNavItem } from "@/components/portal/PortalBottomNav";
import PortalSidebar from "@/components/portal/PortalSidebar";
import PortalTopBar from "@/components/portal/PortalTopBar";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  hydrateSidebarFromStorage,
  setMobileNavOpen,
  setSidebarCollapsed,
} from "@/store/slices/uiSlice";

interface PortalShellProps {
  children: React.ReactNode;
  navItems: PortalNavItem[];
  brand: { title: string; subtitle: string; href: string };
  topBar: { title: string; subtitle?: string; accent?: "buyer" | "seller" };
}

export default function PortalShell({ children, navItems, brand, topBar }: PortalShellProps) {
  const dispatch = useAppDispatch();
  const mobileNavOpen = useAppSelector((s) => s.ui.mobileNavOpen);
  const sidebarCollapsed = useAppSelector((s) => s.ui.sidebarCollapsed);

  // Read the persisted preference after mount so SSR and first paint agree.
  React.useEffect(() => {
    dispatch(hydrateSidebarFromStorage());
  }, [dispatch]);

  const handleCollapsedChange = React.useCallback(
    (collapsed: boolean) => dispatch(setSidebarCollapsed(collapsed)),
    [dispatch]
  );

  const closeMobileNav = React.useCallback(
    () => dispatch(setMobileNavOpen(false)),
    [dispatch]
  );

  const openMobileNav = React.useCallback(
    () => dispatch(setMobileNavOpen(true)),
    [dispatch]
  );

  return (
    <PortalAuthGuard>
      <div className="flex min-h-dvh bg-portal-bg text-portal-fg">
        <PortalSidebar
          items={navItems}
          brand={brand}
          accent={topBar.accent}
          mobileOpen={mobileNavOpen}
          collapsed={sidebarCollapsed}
          onCollapsedChange={handleCollapsedChange}
          onMobileClose={closeMobileNav}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <PortalTopBar {...topBar} onMenuClick={openMobileNav} />
          <main className="flex-1 pb-24 lg:pb-6">{children}</main>
          <PortalBottomNav items={navItems} accent={topBar.accent} />
        </div>
      </div>
    </PortalAuthGuard>
  );
}
