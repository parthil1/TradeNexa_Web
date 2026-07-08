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

  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    const handleScroll = () => {
      if (bodyRef.current) {
        setIsScrolled(bodyRef.current.scrollTop > 8);
      }
    };

    const bodyEl = bodyRef.current;
    if (bodyEl) {
      bodyEl.addEventListener("scroll", handleScroll);
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
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className={`relative flex max-h-[92dvh] w-full sm:max-h-[88dvh] ${maxWidthClasses[maxWidth]} flex-col overflow-hidden rounded-t-2xl border border-slate-200/80 bg-white shadow-[0_24px_64px_-12px_rgba(15,23,42,0.18)] sm:rounded-2xl`}
          >
            {headerSlot && <div className="shrink-0">{headerSlot}</div>}

            {!hideHeader && (
              <div
                className={`flex shrink-0 items-center justify-between border-b px-6 py-4 transition-all duration-200 ${
                  isScrolled
                    ? "z-10 border-slate-100 bg-white/95 shadow-sm backdrop-blur-md"
                    : "border-transparent bg-white"
                }`}
              >
                <div className="mr-4 min-w-0 flex-1">{title}</div>
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:ring-2 focus-visible:ring-primary/20"
                  aria-label="Close modal"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <div
              ref={bodyRef}
              data-form-scroll-container
              className={`min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-area ${bodyClassName}`}
            >
              {children}
            </div>

            {footer && (
              <div className="shrink-0 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
