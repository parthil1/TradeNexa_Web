"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Download,
  Eye,
  Film,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

export type MediaPreviewKind = "thumbnail" | "image" | "video";

export interface MediaPreviewItem {
  kind: MediaPreviewKind;
  url: string;
  name: string;
  index?: number;
  file?: File;
  source?: "existing" | "new";
}

interface MediaPreviewModalProps {
  items: MediaPreviewItem[];
  activeIndex: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onDelete: (item: MediaPreviewItem) => void;
}

export default function MediaPreviewModal({
  items,
  activeIndex,
  onClose,
  onNavigate,
  onDelete,
}: MediaPreviewModalProps) {
  const [zoom, setZoom] = useState(1);
  const item = activeIndex !== null ? items[activeIndex] : null;
  const isImage = item?.kind === "thumbnail" || item?.kind === "image";

  useEffect(() => {
    if (activeIndex === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [activeIndex]);

  const goPrev = useCallback(() => {
    if (activeIndex === null || items.length <= 1) return;
    onNavigate((activeIndex - 1 + items.length) % items.length);
  }, [activeIndex, items.length, onNavigate]);

  const goNext = useCallback(() => {
    if (activeIndex === null || items.length <= 1) return;
    onNavigate((activeIndex + 1) % items.length);
  }, [activeIndex, items.length, onNavigate]);

  useEffect(() => {
    if (activeIndex === null) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(3, z + 0.25));
      if (e.key === "-") setZoom((z) => Math.max(0.5, z - 0.25));
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, goNext, goPrev, onClose]);

  const handleDownload = () => {
    if (!item) return;
    const a = document.createElement("a");
    a.href = item.url;
    a.download = item.name || "media";
    a.click();
  };

  return (
    <AnimatePresence>
      {activeIndex !== null && item ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col bg-slate-950/95 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Media preview"
        >
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{item.name}</p>
              <p className="text-xs text-slate-400">
                {activeIndex + 1} of {items.length}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {isImage ? (
                <>
                  <IconButton label="Zoom out" onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}>
                    <ZoomOut className="h-4 w-4" />
                  </IconButton>
                  <span className="min-w-[3rem] text-center text-xs text-slate-400">
                    {Math.round(zoom * 100)}%
                  </span>
                  <IconButton label="Zoom in" onClick={() => setZoom((z) => Math.min(3, z + 0.25))}>
                    <ZoomIn className="h-4 w-4" />
                  </IconButton>
                </>
              ) : null}
              <IconButton label="Download" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </IconButton>
              <IconButton label="Delete" onClick={() => onDelete(item)} danger>
                <Trash2 className="h-4 w-4" />
              </IconButton>
              <IconButton label="Close" onClick={onClose}>
                <X className="h-4 w-4" />
              </IconButton>
            </div>
          </div>

          <div
            className="relative flex flex-1 items-center justify-center overflow-hidden p-4"
            onWheel={(e) => {
              if (!isImage) return;
              e.preventDefault();
              setZoom((z) => Math.min(3, Math.max(0.5, z - e.deltaY * 0.001)));
            }}
          >
            {items.length > 1 ? (
              <NavButton dir="prev" onClick={goPrev} />
            ) : null}

            <AnimatePresence mode="wait">
              <motion.div
                key={`${item.kind}-${item.url}`}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="flex max-h-full max-w-full items-center justify-center"
              >
                {item.kind === "video" ? (
                  <video
                    src={item.url}
                    controls
                    className="max-h-[75vh] max-w-full rounded-2xl shadow-2xl"
                  />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={item.url}
                    alt={item.name}
                    className="max-h-[75vh] max-w-full rounded-2xl object-contain shadow-2xl transition-transform duration-200"
                    style={{ transform: `scale(${zoom})` }}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {items.length > 1 ? (
              <NavButton dir="next" onClick={goNext} />
            ) : null}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function IconButton({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
        danger
          ? "text-red-400 hover:bg-red-500/20"
          : "text-slate-300 hover:bg-white/10 hover:text-white"
      }`}
      aria-label={label}
    >
      {children}
    </motion.button>
  );
}

function NavButton({ dir, onClick }: { dir: "prev" | "next"; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`absolute top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 px-3 py-6 text-white backdrop-blur-sm transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
        dir === "prev" ? "left-3 sm:left-6" : "right-3 sm:right-6"
      }`}
      aria-label={dir === "prev" ? "Previous" : "Next"}
    >
      {dir === "prev" ? "‹" : "›"}
    </motion.button>
  );
}
