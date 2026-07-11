"use client";

import React, { useMemo } from "react";
import PortalShell from "@/components/portal/PortalShell";
import { sellerNavItems } from "@/components/portal/portalNavConfig";
import { useChatUnreadBadge } from "@/components/chat/ConversationBadge";

export default function SellerShell({ children }: { children: React.ReactNode }) {
  const unread = useChatUnreadBadge();
  const navItems = useMemo(
    () =>
      sellerNavItems.map((item) =>
        item.href === "/seller/leads" ? { ...item, badge: unread || undefined } : item
      ),
    [unread]
  );

  return (
    <PortalShell
      navItems={navItems}
      brand={{ title: "Seller Central", subtitle: "TradeNexa", href: "/seller/dashboard" }}
      topBar={{ title: "Seller Central", accent: "seller" }}
    >
      {children}
    </PortalShell>
  );
}
