"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import ChatPanel, { type ChatPanelProps } from "@/components/chat/ChatPanel";

interface ChatSidePanelProps extends Omit<ChatPanelProps, "className" | "embedded"> {
  open: boolean;
  onClose: () => void;
  /** Eyebrow label — keep uppercase styling consistent with seller inline chat */
  title?: string;
}

export default function ChatSidePanel({
  open,
  onClose,
  title = "Chat with Seller",
  ...chatProps
}: ChatSidePanelProps) {
  const [mounted, setMounted] = React.useState(false);

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

    // Lock background scroll without breaking sticky/fixed portal chrome.
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

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end">
      <button
        type="button"
        aria-label="Close chat"
        className="absolute inset-0 bg-[#0D1B2A]/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <aside
        className="relative flex h-full w-full max-w-[min(100vw,32rem)] flex-col bg-white shadow-2xl animate-in slide-in-from-right sm:max-w-[36rem]"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#E8ECF0] px-4 py-3.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#90A4AE]">{title}</p>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#E0E6ED] text-[#546E7A] transition hover:bg-[#F4F6F9]"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <ChatPanel
          key={`${chatProps.rfqId}-${chatProps.sellerId ?? "unknown"}-${chatProps.otherPartyName ?? ""}`}
          {...chatProps}
          embedded
          className="min-h-0 flex-1 !h-full !max-h-none"
        />
      </aside>
    </div>,
    document.body
  );
}
