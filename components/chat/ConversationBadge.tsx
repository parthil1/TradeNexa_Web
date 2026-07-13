"use client";

import React, { useMemo } from "react";
import { useChat } from "@/context/ChatContext";
import { effectiveConversationUnread } from "@/utils/chatHelpers";

/** WhatsApp-style unread count label (caps at 99+). */
export function formatChatBadgeCount(count: number): string {
  if (count <= 0) return "";
  return count > 99 ? "99+" : String(count);
}

/** Unread count for portal nav items (Inquiries / Leads). */
export function useChatUnreadBadge(): number {
  const { unreadSummary, conversationsMeta } = useChat();

  return useMemo(() => {
    const metaValues = Object.values(conversationsMeta);
    if (metaValues.length > 0) {
      const fromMeta = metaValues.reduce(
        (sum, conversation) => sum + effectiveConversationUnread(conversation),
        0
      );
      // Prefer conversation list when hydrated — strips SYSTEM inflation the API total includes.
      return fromMeta;
    }
    return unreadSummary.total_unread > 0 ? unreadSummary.total_unread : 0;
  }, [conversationsMeta, unreadSummary.total_unread]);
}

/**
 * Unread for a specific RFQ chat (side-panel entry points).
 * Buyer: pass sellerId to match that quotation's conversation.
 * Seller: omit sellerId — matches conversations for this RFQ.
 */
export function useRfqChatUnread(rfqId?: number | null, sellerId?: number | null): number {
  const { conversationsMeta } = useChat();

  return useMemo(() => {
    if (rfqId == null) return 0;

    let total = 0;
    for (const conversation of Object.values(conversationsMeta)) {
      if (conversation.rfq_id != null && conversation.rfq_id !== rfqId) continue;

      if (sellerId != null) {
        const sid =
          conversation.seller?.id ??
          conversation.seller?.user_id ??
          conversation.other_party?.id ??
          conversation.other_party?.user_id;
        if (sid != null && sid !== sellerId) continue;
        if (sid == null && conversation.rfq_id !== rfqId) continue;
      } else if (conversation.rfq_id !== rfqId) {
        continue;
      }

      total += effectiveConversationUnread(conversation);
    }
    return total;
  }, [conversationsMeta, rfqId, sellerId]);
}

type BadgeSize = "sm" | "md";

/**
 * WhatsApp-style unread count pill — green circle/pill with the message count.
 */
export default function ConversationBadge({
  count,
  className = "",
  size = "sm",
}: {
  count: number;
  className?: string;
  /** sm = nav/icon overlay; md = chat entry buttons */
  size?: BadgeSize;
}) {
  if (!count) return null;
  const label = formatChatBadgeCount(count);
  const sizeClass =
    size === "md"
      ? "h-5 min-w-5 px-1.5 text-[11px]"
      : "h-[18px] min-w-[18px] px-1 text-[10px]";

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-whatsapp font-bold tabular-nums leading-none text-white shadow-sm ${sizeClass} ${className}`}
      aria-label={`${count} unread message${count === 1 ? "" : "s"}`}
      title={`${count} unread`}
    >
      {label}
    </span>
  );
}
