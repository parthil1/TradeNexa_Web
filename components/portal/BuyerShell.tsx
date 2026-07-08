"use client";

import React from "react";
import PortalShell from "@/components/portal/PortalShell";
import { buyerNavItems } from "@/components/portal/portalNavConfig";

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
