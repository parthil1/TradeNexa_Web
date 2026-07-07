"use client";

import React from "react";
import { BarChart3, LayoutDashboard, MessageSquare, Package, User } from "lucide-react";
import PortalShell from "@/components/portal/PortalShell";
import type { PortalNavItem } from "@/components/portal/PortalBottomNav";

const sellerNavItems: PortalNavItem[] = [
  { label: "Dashboard", href: "/seller/dashboard", icon: LayoutDashboard, match: (p) => p.startsWith("/seller/dashboard") },
  { label: "Catalog", href: "/seller/catalog", icon: Package, match: (p) => p.startsWith("/seller/catalog") || p.startsWith("/seller/add-product") },
  { label: "Leads", href: "/seller/leads", icon: MessageSquare, match: (p) => p.startsWith("/seller/lead"), badge: 3 },
  { label: "Analytics", href: "/seller/analytics", icon: BarChart3, match: (p) => p.startsWith("/seller/analytics") },
  { label: "Profile", href: "/seller/profile", icon: User, match: (p) => p.startsWith("/seller/profile") || p.startsWith("/seller/edit-profile") || p.startsWith("/seller/plans") },
];

export default function SellerShell({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell
      navItems={sellerNavItems}
      brand={{ title: "Seller Central", subtitle: "TradeNexa", href: "/seller/dashboard" }}
      topBar={{ title: "Seller Central", accent: "seller" }}
    >
      {children}
    </PortalShell>
  );
}
