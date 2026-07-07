"use client";

import React from "react";
import { Home, Search, LayoutGrid, MessageSquare, User } from "lucide-react";
import PortalShell from "@/components/portal/PortalShell";
import type { PortalNavItem } from "@/components/portal/PortalBottomNav";

const buyerNavItems: PortalNavItem[] = [
  { label: "Home", href: "/buyer/home", icon: Home, match: (p) => p.startsWith("/buyer/home") },
  { label: "Search", href: "/buyer/search", icon: Search, match: (p) => p.startsWith("/buyer/search") },
  { label: "Categories", href: "/buyer/categories", icon: LayoutGrid, match: (p) => p.startsWith("/buyer/categor") },
  { label: "Inquiries", href: "/buyer/inquiries", icon: MessageSquare, match: (p) => p.startsWith("/buyer/inquir"), badge: 2 },
  { label: "Profile", href: "/buyer/profile", icon: User, match: (p) => p.startsWith("/buyer/profile") || p.startsWith("/buyer/settings") || p.startsWith("/buyer/edit-profile") },
];

export default function BuyerShell({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell
      navItems={buyerNavItems}
      brand={{ title: "Buyer Workspace", subtitle: "TradeNexa", href: "/buyer/home" }}
      topBar={{ title: "Buyer Central", accent: "buyer" }}
    >
      {children}
    </PortalShell>
  );
}
