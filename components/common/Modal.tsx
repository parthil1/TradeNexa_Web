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
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = "md",
}: ModalProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Disable body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
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
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4 md:p-6">
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
            initial={{ scale: 0.98, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.98, opacity: 0, y: 24 }}
            transition={{ type: "spring", duration: 0.4 }}
            className={`relative flex max-h-[92dvh] w-full ${maxWidthClasses[maxWidth]} flex-col overflow-hidden rounded-t-2xl border border-slate-100/50 bg-white shadow-2xl sm:max-h-[85dvh] sm:rounded-2xl`}
          >
            {/* Sticky Header */}
            <div
              className={`flex items-center justify-between px-6 py-4.5 transition-all duration-300 border-b border-slate-100 ${
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

            {/* Scrollable Body */}
            <div
              ref={bodyRef}
              className="scroll-area flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 sm:py-6"
            >
              {children}
            </div>

            {/* Sticky Footer */}
            {footer && (
              <div className="border-t border-slate-100 px-6 py-4 bg-slate-50/70 backdrop-blur-sm">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
