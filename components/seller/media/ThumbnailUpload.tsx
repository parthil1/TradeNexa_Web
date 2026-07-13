"use client";

import React, { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Eye, ImageIcon, RefreshCw, Trash2, Upload } from "lucide-react";
import { MAX_THUMBNAIL_MB, filterImageFiles } from "./mediaUtils";
import { showErrorToast } from "@/utils/toast";

interface ThumbnailUploadProps {
  previewUrl: string | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onSelect: (file: File | null) => void;
  onRemove: () => void;
  onPreview: () => void;
  error?: string;
}

function ActionButton({
  label,
  onClick,
  variant = "default",
  children,
}: {
  label: string;
  onClick: () => void;
  variant?: "default" | "danger";
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`flex h-8 w-8 items-center justify-center rounded-full shadow-md backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 ${
        variant === "danger"
          ? "bg-red-500 text-white hover:bg-red-600"
          : "bg-white/95 text-foreground hover:bg-white"
      }`}
      aria-label={label}
    >
      {children}
    </motion.button>
  );
}

export default function ThumbnailUpload({
  previewUrl,
  inputRef,
  onSelect,
  onRemove,
  onPreview,
  error,
}: ThumbnailUploadProps) {
  const [dragOver, setDragOver] = useState(false);

  const openPicker = () => inputRef.current?.click();

  const acceptFile = useCallback(
    (file: File | null) => {
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        showErrorToast("Please upload a valid image file.");
        return;
      }
      if (file.size > MAX_THUMBNAIL_MB * 1024 * 1024) {
        showErrorToast(`Thumbnail must be under ${MAX_THUMBNAIL_MB}MB.`);
        return;
      }
      onSelect(file);
    },
    [onSelect]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    acceptFile(e.dataTransfer.files?.[0] ?? null);
  };

  const borderClass = error
    ? "border-error/50 ring-2 ring-error/15"
    : dragOver
      ? "border-primary bg-primary/5 shadow-[0_0_0_4px_rgba(37,99,235,0.12)]"
      : "border-muted-fg hover:border-primary/50 hover:bg-primary/[0.03]";

  const containerClass = previewUrl
    ? `border-2 border-solid bg-card shadow-sm ${error ? "border-error/50" : "border-border"}`
    : `border-2 border-dashed ${borderClass}`;

  return (
    <div className="w-full shrink-0 lg:w-[180px]" data-form-field="thumbnail">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-fg">
        Thumbnail <span className="text-error">*</span>
      </p>

      <motion.div
        layout
        className={`group relative mx-auto h-[180px] w-[180px] overflow-hidden rounded-2xl transition-all duration-300 lg:mx-0 ${containerClass}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {previewUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
              src={previewUrl}
              alt="Product thumbnail"
              className="h-full w-full object-cover"
            />
            <span className="pointer-events-none absolute left-2.5 top-2.5 rounded-lg bg-navy/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
              Thumbnail
            </span>
            <button
              type="button"
              onClick={onRemove}
              className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-muted-fg shadow-md transition hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 lg:opacity-0 lg:group-hover:opacity-100"
              aria-label="Remove thumbnail"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-navy/75 via-navy/20 to-transparent pb-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
              <div className="flex items-center gap-2">
                <ActionButton label="Replace thumbnail" onClick={openPicker}>
                  <RefreshCw className="h-3.5 w-3.5" />
                </ActionButton>
                <ActionButton label="Preview thumbnail" onClick={onPreview}>
                  <Eye className="h-3.5 w-3.5" />
                </ActionButton>
                <ActionButton label="Remove thumbnail" onClick={onRemove} variant="danger">
                  <Trash2 className="h-3.5 w-3.5" />
                </ActionButton>
              </div>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={openPicker}
            className="flex h-full w-full flex-col items-center justify-center gap-2.5 p-4 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
            aria-label="Upload thumbnail"
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"
            >
              <ImageIcon className="h-6 w-6 text-primary" />
            </motion.div>
            <div>
              <p className="text-sm font-semibold text-foreground">Upload Thumbnail</p>
              <p className="mt-0.5 text-[11px] text-muted-fg">JPG, PNG, WebP</p>
              <p className="text-[10px] text-muted-fg">Max {MAX_THUMBNAIL_MB} MB</p>
            </div>
            <span className="flex items-center gap-1 text-[10px] font-medium text-muted-fg">
              <Upload className="h-3 w-3" />
              Drag & drop
            </span>
          </button>
        )}
      </motion.div>

      <input
        ref={inputRef}
        id="product-thumbnail"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        className="hidden"
        onChange={(e) => {
          acceptFile(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />

      {error ? (
        <p role="alert" className="mt-2 text-xs font-medium text-error">
          {error}
        </p>
      ) : (
        <p className="mt-2 text-xs text-muted-fg">Main image in search & listings</p>
      )}
    </div>
  );
}
