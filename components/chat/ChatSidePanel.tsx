"use client";

import React, { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X } from "lucide-react";
import ChatPanel, { type ChatPanelProps } from "@/components/chat/ChatPanel";
import { useChat } from "@/context/ChatContext";
import { conversationCounterpartyLogo } from "@/utils/chatHelpers";
import { getInitials, resolveImageUrl } from "@/utils/catalogHelpers";

interface ChatSidePanelProps extends Omit<ChatPanelProps, "className" | "embedded" | "hideHeader"> {
  open: boolean;
  onClose: () => void;
  /** @deprecated Side header shows logo + name only; kept for aria-label fallback. */
  title?: string;
  /** Fallback when conversation meta has no profile_image yet. */
  otherPartyLogo?: string | null;
}

export default function ChatSidePanel({
  open,
  onClose,
  title = "Chat",
  otherPartyName,
  otherPartyLogo,
  ...chatProps
}: ChatSidePanelProps) {
  const [mounted, setMounted] = React.useState(false);
  const { activeConversationId, conversationsMeta } = useChat();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const scrollY = window.scrollY;
    const { body } = document;
    const previous = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      paddingRight: body.style.paddingRight,
    };

    const scrollbarGap = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    if (scrollbarGap > 0) {
      body.style.paddingRight = `${scrollbarGap}px`;
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    return () => {
      body.style.overflow = previous.overflow;
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.width = previous.width;
      body.style.paddingRight = previous.paddingRight;
      window.scrollTo(0, scrollY);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const conversationMeta = useMemo(() => {
    const propId =
      chatProps.conversationId != null && chatProps.conversationId > 0
        ? chatProps.conversationId
        : null;
    const id = propId ?? activeConversationId;
    if (id != null && conversationsMeta[id]) return conversationsMeta[id];

    if (chatProps.inquiryId != null && chatProps.inquiryId > 0) {
      return (
        Object.values(conversationsMeta).find(
          (c) => c.inquiry_id === chatProps.inquiryId
        ) ?? null
      );
    }
    return null;
  }, [
    activeConversationId,
    chatProps.conversationId,
    chatProps.inquiryId,
    conversationsMeta,
  ]);

  const displayName =
    otherPartyName?.trim() ||
    conversationMeta?.other_party?.company_name?.trim() ||
    conversationMeta?.other_party?.name?.trim() ||
    title ||
    "Chat";

  const logoUrl = useMemo(() => {
    const fromConversation = conversationCounterpartyLogo(
      conversationMeta,
      chatProps.role
    );
    return resolveImageUrl(fromConversation ?? otherPartyLogo);
  }, [conversationMeta, chatProps.role, otherPartyLogo]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end">
      <button
        type="button"
        aria-label="Close chat"
        className="absolute inset-0 bg-navy/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <aside
        className="relative flex h-full w-full max-w-[min(100vw,32rem)] flex-col bg-card shadow-[var(--shadow-elevated)] sm:max-w-[36rem]"
        role="dialog"
        aria-modal="true"
        aria-label={displayName}
      >
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-soft text-sm font-bold text-primary">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt=""
                  width={36}
                  height={36}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                getInitials(displayName)
              )}
            </span>
            <p className="truncate text-sm font-bold text-foreground">{displayName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border text-muted-fg transition-colors duration-200 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
            aria-label="Close chat"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </header>
        <ChatPanel
          key={`${chatProps.rfqId}-${chatProps.sellerId ?? "unknown"}-${displayName}`}
          {...chatProps}
          otherPartyName={otherPartyName}
          embedded
          hideHeader
          className="min-h-0 flex-1 !h-full !max-h-none"
        />
      </aside>
    </div>,
    document.body
  );
}
