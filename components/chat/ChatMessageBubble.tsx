"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import {
  Award,
  Check,
  CheckCheck,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  FileType,
  ImageIcon,
  Info,
  Loader2,
  MoreVertical,
  Package,
  Pencil,
  RotateCcw,
  X,
  XCircle,
} from "lucide-react";
import type { ApiChatMessage } from "@/types/chat";
import { getChatFileDisplayName, isSystemChatMessage } from "@/utils/chatHelpers";
import { formatPrice, getInitials, resolveImageUrl } from "@/utils/catalogHelpers";

function formatTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatFileSize(bytes?: number | null) {
  if (bytes == null || !Number.isFinite(bytes) || bytes <= 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocumentTypeIcon({ fileName }: { fileName?: string | null }) {
  const lower = (fileName ?? "").toLowerCase();
  if (lower.endsWith(".pdf")) return <FileType className="h-5 w-5 text-red-500" />;
  if (lower.endsWith(".xls") || lower.endsWith(".xlsx")) {
    return <FileSpreadsheet className="h-5 w-5 text-emerald-600" />;
  }
  if (lower.endsWith(".doc") || lower.endsWith(".docx")) {
    return <FileText className="h-5 w-5 text-[#1565C0]" />;
  }
  return <FileText className="h-5 w-5 text-[#546E7A]" />;
}

function SystemEventIcon({ content }: { content?: string | null }) {
  const text = (content ?? "").toLowerCase();
  if (text.includes("award")) return <Award className="h-3.5 w-3.5 shrink-0" />;
  if (text.includes("accept")) return <Check className="h-3.5 w-3.5 shrink-0" />;
  if (text.includes("revis")) return <Pencil className="h-3.5 w-3.5 shrink-0" />;
  if (text.includes("reject") || text.includes("cancel") || text.includes("withdraw")) {
    return <XCircle className="h-3.5 w-3.5 shrink-0" />;
  }
  return <Info className="h-3.5 w-3.5 shrink-0" />;
}

function ReadTicks({ message }: { message: ApiChatMessage }) {
  if (!message.is_mine) return null;
  if (message.send_status === "sending") {
    return <Clock className="h-3.5 w-3.5 text-[#90A4AE]" aria-label="Sending" />;
  }
  if (message.send_status === "failed") {
    return <RotateCcw className="h-3.5 w-3.5 text-red-500" aria-label="Failed" />;
  }
  if (message.read_at) {
    return <CheckCheck className="h-3.5 w-3.5 text-[#1565C0]" aria-label="Read" />;
  }
  return <Check className="h-3.5 w-3.5 text-[#90A4AE]" aria-label="Sent" />;
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#90A4AE]">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-[#0D1B2A]">{value}</p>
    </div>
  );
}

export default function ChatMessageBubble({
  message,
  onRetry,
  showAvatar = false,
  showTimestamp = true,
  avatarName,
  className = "",
}: {
  message: ApiChatMessage;
  onRetry?: () => void;
  showAvatar?: boolean;
  /** When false, timestamp stays available on hover only (still rendered). */
  showTimestamp?: boolean;
  avatarName?: string | null;
  className?: string;
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imageMenuOpen, setImageMenuOpen] = useState(false);
  const [imageBroken, setImageBroken] = useState(false);
  const [hydratedImageSrc, setHydratedImageSrc] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [imageMenuStyle, setImageMenuStyle] = useState<React.CSSProperties>({});
  const imageMenuRef = useRef<HTMLDivElement>(null);
  const isSystem = isSystemChatMessage(message);
  const mine = message.is_mine === true;
  const isText = message.message_type === "TEXT";
  const isImage = message.message_type === "IMAGE";
  const rawBackendSrc = [message.media_url, message.file_url, hydratedImageSrc].find(
    (url) => url && !url.startsWith("blob:") && !url.startsWith("data:")
  );
  const imageUrl = resolveImageUrl(rawBackendSrc);
  const imageFileName = getChatFileDisplayName(message);
  const quote = message.quotation;
  const quoteTotal =
    quote?.price != null && quote?.quantity != null
      ? quote.price * quote.quantity
      : null;
  const timeLabel = formatTime(message.created_at);
  const canShowImage = Boolean(imageUrl) && !imageBroken;
  const isUploadingImage = isImage && message.send_status === "sending";
  const needsBackendImage =
    isImage &&
    message.id > 0 &&
    Boolean(message.conversation_id) &&
    !imageUrl &&
    !isUploadingImage;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setImageBroken(false);
  }, [imageUrl]);

  useEffect(() => {
    if (!needsBackendImage) return;

    let cancelled = false;
    setImageLoading(true);

    void import("@/services/chatService")
      .then(({ resolveChatImageSrc }) =>
        resolveChatImageSrc({
          id: message.id,
          conversation_id: message.conversation_id,
          media_url: null,
          file_url: null,
          message_type: message.message_type,
        })
      )
      .then((src) => {
        if (cancelled || !src) return;
        if (src.startsWith("blob:") || src.startsWith("data:")) return;
        setHydratedImageSrc(src);
      })
      .finally(() => {
        if (!cancelled) setImageLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    needsBackendImage,
    message.id,
    message.conversation_id,
    message.message_type,
  ]);

  useEffect(() => {
    if (!imageMenuOpen || !imageMenuRef.current) return;

    const anchor = imageMenuRef.current.getBoundingClientRect();
    const menuWidth = 160;
    const menuHeight = 96;
    const gap = 6;
    const padding = 8;

    let top = anchor.bottom + gap;
    if (top + menuHeight > window.innerHeight - padding) {
      top = Math.max(padding, anchor.top - menuHeight - gap);
    }

    let left = anchor.right - menuWidth;
    if (left < padding) left = padding;
    if (left + menuWidth > window.innerWidth - padding) {
      left = window.innerWidth - menuWidth - padding;
    }

    setImageMenuStyle({ top, left });
  }, [imageMenuOpen]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [lightboxOpen]);

  async function downloadImage() {
    if (!imageUrl) return;
    setImageMenuOpen(false);
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = imageFileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(imageUrl, "_blank", "noopener,noreferrer");
    }
  }

  if (isSystem) {
    const label = message.content?.trim() || "Status update";
    return (
      <div className={`flex justify-center px-2 ${className}`}>
        <div className="inline-flex max-w-[95%] items-center gap-1.5 rounded-full bg-[#EEF1F4] px-3 py-1.5 text-[12px] font-semibold text-[#546E7A]">
          <SystemEventIcon content={label} />
          <span className="min-w-0 whitespace-normal break-words text-center leading-snug">
            {label}
          </span>
          {timeLabel ? (
            <>
              <span className="text-[#CFD8DC]" aria-hidden>
                ·
              </span>
              <span className="shrink-0 tabular-nums text-[#90A4AE]">{timeLabel}</span>
            </>
          ) : null}
        </div>
      </div>
    );
  }

  const bubbleShell = mine
    ? isText
      ? "bg-[#1565C0] text-white"
      : isImage
        ? "bg-transparent p-0 shadow-none ring-0"
        : "bg-white text-[#0D1B2A] ring-1 ring-[#E8ECF0]"
    : isImage
      ? "bg-transparent p-0 shadow-none ring-0"
      : "bg-[#F4F6F9] text-[#0D1B2A] ring-1 ring-[#E8ECF0]/80";

  return (
    <div
      className={`group flex max-w-[88%] gap-2 ${mine ? "ml-auto flex-row-reverse" : "mr-auto"} ${className}`}
    >
      <div className="flex w-7 shrink-0 justify-center pt-0.5">
        {!mine ? (
          showAvatar ? (
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E3F2FD] text-[11px] font-bold text-[#1565C0]"
              title={avatarName || message.sender_name || "Seller"}
            >
              {getInitials(avatarName || message.sender_name || "?")}
            </span>
          ) : (
            <span className="h-7 w-7" aria-hidden />
          )
        ) : null}
      </div>

      <div className={`flex min-w-0 flex-col gap-1 ${mine ? "items-end" : "items-start"}`}>
        {showAvatar && !mine ? (
          <p className="px-1 text-[11px] font-semibold text-[#546E7A]">
            {avatarName || message.sender_name || "Seller"}
          </p>
        ) : null}

        <div
          className={`rounded-2xl text-sm shadow-sm ${
            isImage ? "overflow-hidden p-0" : "px-3.5 py-2.5"
          } ${bubbleShell} ${
            message.message_type === "QUOTATION" ? "border-l-[3px] border-l-[#1565C0] pl-3" : ""
          }`}
        >
          {isText ? (
            <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
          ) : null}

          {message.message_type === "PRODUCT" && message.product ? (
            <div className="flex gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#E8ECF0]">
                {message.product.thumbnail ? (
                  <Image
                    src={resolveImageUrl(message.product.thumbnail) || ""}
                    alt={message.product.name ?? "Product"}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Package className="h-5 w-5 text-[#90A4AE]" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-[#0D1B2A]">
                  {message.product.name ?? `Product #${message.product.id}`}
                </p>
                {message.product.price != null ? (
                  <p className="mt-0.5 text-sm font-semibold text-[#1565C0]">
                    {formatPrice(message.product.price, message.product.currency)}
                    {message.product.unit ? (
                      <span className="text-xs font-medium text-[#546E7A]">
                        {" "}
                        / {message.product.unit}
                      </span>
                    ) : null}
                  </p>
                ) : null}
                <Link
                  href={`/buyer/product/${message.product.id}`}
                  className="mt-1.5 inline-flex items-center gap-0.5 text-xs font-semibold text-[#1565C0] hover:underline"
                >
                  View Product
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ) : null}

          {message.message_type === "QUOTATION" && quote ? (
            <div className="min-w-[200px]">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#90A4AE]">
                Quotation #{quote.id}
              </p>
              <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                <MetaCell
                  label="Unit price"
                  value={
                    quote.price != null ? formatPrice(quote.price, quote.currency) : "—"
                  }
                />
                <MetaCell
                  label="Quantity"
                  value={
                    quote.quantity != null
                      ? `${quote.quantity}${quote.unit ? ` ${quote.unit}` : ""}`
                      : "—"
                  }
                />
                <MetaCell
                  label="Delivery"
                  value={
                    quote.delivery_days != null ? `${quote.delivery_days} days` : "—"
                  }
                />
                <MetaCell
                  label="Total"
                  value={
                    quoteTotal != null ? formatPrice(quoteTotal, quote.currency) : "—"
                  }
                />
              </div>
            </div>
          ) : null}

          {message.message_type === "IMAGE" ? (
            <div className="w-[min(240px,75vw)] rounded-2xl bg-white shadow-sm ring-1 ring-[#E8ECF0]">
              <div className="relative overflow-hidden rounded-t-2xl bg-[#F4F6F9]">
                {canShowImage ? (
                  <button
                    type="button"
                    onClick={() => setLightboxOpen(true)}
                    className="block w-full text-left"
                    aria-label="Preview image"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl!}
                      alt={imageFileName}
                      className="max-h-56 w-full object-cover"
                      onError={() => setImageBroken(true)}
                    />
                  </button>
                ) : imageLoading || isUploadingImage ? (
                  <div className="flex h-28 flex-col items-center justify-center gap-2 text-xs text-[#546E7A]">
                    <Loader2 className="h-5 w-5 animate-spin text-[#1565C0]" />
                    {isUploadingImage ? "Uploading..." : "Loading image..."}
                  </div>
                ) : (
                  <div className="flex h-28 flex-col items-center justify-center gap-1 px-3 text-center text-xs text-[#546E7A]">
                    <ImageIcon className="h-5 w-5" />
                    <span>Preview unavailable</span>
                  </div>
                )}

                {canShowImage ? (
                  <div ref={imageMenuRef} className="absolute right-2 top-2 z-10">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageMenuOpen((open) => !open);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-[#0D1B2A] shadow-md ring-1 ring-[#E8ECF0] transition hover:bg-white"
                      aria-label="Image options"
                      aria-expanded={imageMenuOpen}
                      aria-haspopup="menu"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="flex items-center gap-2 rounded-b-2xl border-t border-[#E8ECF0] px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-semibold text-[#0D1B2A]">
                    {imageFileName}
                  </p>
                  {formatFileSize(message.file_size) ? (
                    <p className="text-[10px] text-[#90A4AE]">
                      {formatFileSize(message.file_size)}
                    </p>
                  ) : null}
                </div>
              </div>

              {mounted && imageMenuOpen && canShowImage
                ? createPortal(
                    <div
                      className="fixed inset-0 z-[210]"
                      onClick={() => setImageMenuOpen(false)}
                    >
                      <div
                        role="menu"
                        className="absolute w-40 overflow-hidden rounded-xl border border-[#E8ECF0] bg-white py-1 shadow-xl shadow-slate-900/15"
                        style={imageMenuStyle}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setImageMenuOpen(false);
                            setLightboxOpen(true);
                          }}
                          className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs font-semibold text-[#0D1B2A] transition hover:bg-[#F4F6F9]"
                        >
                          <Eye className="h-4 w-4 shrink-0 text-[#546E7A]" />
                          Preview
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => void downloadImage()}
                          className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs font-semibold text-[#0D1B2A] transition hover:bg-[#F4F6F9]"
                        >
                          <Download className="h-4 w-4 shrink-0 text-[#546E7A]" />
                          Download
                        </button>
                      </div>
                    </div>,
                    document.body
                  )
                : null}
            </div>
          ) : null}

          {message.message_type === "DOCUMENT" ? (
            <a
              href={
                resolveImageUrl(message.file_url || message.media_url) ||
                message.file_url ||
                message.media_url ||
                "#"
              }
              target="_blank"
              rel="noreferrer"
              className="flex min-w-[180px] items-center gap-2.5 rounded-xl bg-[#FAFBFC] px-2.5 py-2 ring-1 ring-[#E8ECF0]"
            >
              <DocumentTypeIcon fileName={getChatFileDisplayName(message)} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold text-[#0D1B2A]">
                  {getChatFileDisplayName(message)}
                </span>
                {formatFileSize(message.file_size) ? (
                  <span className="mt-0.5 block text-[10px] text-[#90A4AE]">
                    {formatFileSize(message.file_size)}
                  </span>
                ) : null}
              </span>
              <Download className="h-4 w-4 shrink-0 text-[#546E7A]" />
            </a>
          ) : null}

          {message.message_type === "PRODUCT" && !message.product ? (
            <p className="text-xs text-[#546E7A]">Product #{message.product_id}</p>
          ) : null}
          {message.message_type === "QUOTATION" && !message.quotation ? (
            <p className="text-xs text-[#546E7A]">Quotation #{message.quotation_id}</p>
          ) : null}
        </div>

        <div
          className={`flex items-center gap-1.5 px-1 ${
            showTimestamp ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
          }`}
        >
          <span className="text-[11px] tabular-nums text-[#90A4AE]">{timeLabel || "—"}</span>
          <ReadTicks message={message} />
          {message.send_status === "failed" && onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="text-[10px] font-semibold text-red-600 hover:underline"
            >
              Retry
            </button>
          ) : null}
        </div>
      </div>

      {mounted && lightboxOpen && canShowImage && imageUrl
        ? createPortal(
            <div
              className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0D1B2A]/75 p-4"
              role="dialog"
              aria-modal="true"
              aria-label="Image preview"
              onClick={() => setLightboxOpen(false)}
            >
              <div
                className="absolute right-4 top-4 flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => void downloadImage()}
                  className="flex h-9 items-center gap-1.5 rounded-xl bg-white px-3 text-xs font-semibold text-[#0D1B2A] shadow-sm"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#0D1B2A] shadow-sm"
                  aria-label="Close preview"
                  onClick={() => setLightboxOpen(false)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={imageFileName}
                className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl"
                onClick={(e) => e.stopPropagation()}
                onError={() => {
                  setImageBroken(true);
                  setLightboxOpen(false);
                }}
              />
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
