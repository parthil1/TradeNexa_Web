"use client";

import React from "react";
import PortalShell from "@/components/portal/PortalShell";
import { sellerNavItems } from "@/components/portal/portalNavConfig";

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
