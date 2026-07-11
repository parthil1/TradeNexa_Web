"use client";

import React, { useMemo } from "react";
import PortalShell from "@/components/portal/PortalShell";
import { buyerNavItems } from "@/components/portal/portalNavConfig";
import { useChatUnreadBadge } from "@/components/chat/ConversationBadge";

export default function BuyerShell({ children }: { children: React.ReactNode }) {
  const unread = useChatUnreadBadge();
  const navItems = useMemo(
    () =>
      buyerNavItems.map((item) =>
        item.href === "/buyer/inquiries" ? { ...item, badge: unread || undefined } : item
      ),
    [unread]
  );

  return (
    <PortalShell
      navItems={navItems}
      brand={{ title: "Buyer Workspace", subtitle: "TradeNexa", href: "/buyer/home" }}
      topBar={{ title: "Buyer Central", accent: "buyer" }}
    >
      {children}
    </PortalShell>
  );
}
