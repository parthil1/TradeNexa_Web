"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string | React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
  hideHeader?: boolean;
  headerSlot?: React.ReactNode;
  bodyClassName?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = "md",
  hideHeader = false,
  headerSlot,
  bodyClassName = "px-6 py-6",
}: ModalProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Lock page scroll while modal is open (no position restore — avoids jump on close)
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Monitor body scroll offset to toggle sticky header shadow
  useEffect(() => {
    const handleScroll = () => {
      if (bodyRef.current) {
        setIsScrolled(bodyRef.current.scrollTop > 10);
      }
    };

    const bodyEl = bodyRef.current;
    if (bodyEl) {
      bodyEl.addEventListener("scroll", handleScroll);
      // Trigger once on mount/open just in case
      handleScroll();
    }
    return () => {
      if (bodyEl) {
        bodyEl.removeEventListener("scroll", handleScroll);
      }
    };
  }, [isOpen]);

  const maxWidthClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
          {/* Backdrop blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: "spring", duration: 0.4 }}
            className={`relative flex max-h-[85vh] w-full ${maxWidthClasses[maxWidth]} flex-col overflow-hidden rounded-2xl border border-slate-100/50 bg-white shadow-2xl`}
          >
            {/* Fixed custom header (e.g. register gradient) */}
            {headerSlot && <div className="shrink-0">{headerSlot}</div>}

            {/* Sticky Header */}
            {!hideHeader && (
            <div
              className={`shrink-0 flex items-center justify-between px-6 py-4.5 transition-all duration-300 border-b border-slate-100 ${
                isScrolled
                  ? "shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] bg-white/95 backdrop-blur-md z-10"
                  : "bg-white"
              }`}
            >
              <div className="flex-1 mr-4">{title}</div>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            )}

            {/* Scrollable Body */}
            <div
              ref={bodyRef}
              className={`min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent ${bodyClassName}`}
            >
              {children}
            </div>

            {/* Fixed footer — does not scroll with body */}
            {footer && (
              <div className="shrink-0 border-t border-slate-100 bg-white px-6 py-4 shadow-[0_-4px_20px_-8px_rgba(15,23,42,0.08)]">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
