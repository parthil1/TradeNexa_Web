"use client";

import React, { useMemo } from "react";
import PortalShell from "@/components/portal/PortalShell";
import { sellerNavItems } from "@/components/portal/portalNavConfig";
import { useChatUnreadBadge } from "@/components/chat/ConversationBadge";

export default function SellerShell({ children }: { children: React.ReactNode }) {
  const chatUnread = useChatUnreadBadge();
  const navItems = useMemo(
    () =>
      sellerNavItems.map((item) =>
        item.href === "/seller/chats" ? { ...item, badge: chatUnread || undefined } : item
      ),
    [chatUnread]
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
