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
import type { ApiChatMessage, ChatRole } from "@/types/chat";
import {
  getChatFileDisplayName,
  isSystemChatMessage,
  personalizeSystemMessageContent,
  resolveAuthNumericUserId,
} from "@/utils/chatHelpers";
import { formatPrice, getInitials, resolveImageUrl } from "@/utils/catalogHelpers";
import { useAuth } from "@/hooks/useAuth";

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
    return <FileText className="h-5 w-5 text-primary" />;
  }
  return <FileText className="h-5 w-5 text-muted-fg" />;
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

/** Human-readable RFQ / inquiry / product label from message metadata. */
function getSystemContextLabel(message: ApiChatMessage): string | null {
  const rfqTitle = message.rfq?.title?.trim() || message.quotation?.rfq_title?.trim();
  if (rfqTitle) return rfqTitle;

  const productName = message.product?.name?.trim();
  if (productName) return productName;

  const description = message.rfq?.description?.trim();
  if (description) return description;

  const inquiryId = message.inquiry_id ?? message.quotation?.inquiry_id ?? null;
  if (inquiryId != null) return `Inquiry #${inquiryId}`;

  const rfqNumber = message.rfq?.rfq_number?.trim() || message.quotation?.rfq_number?.trim();
  if (rfqNumber) return rfqNumber;

  const quoteNumber = message.quotation?.quotation_number?.trim();
  if (quoteNumber) return quoteNumber;

  return null;
}

/** Deep-link for RFQ / inquiry / product context in system status pills. */
function getSystemContextHref(
  message: ApiChatMessage,
  role?: ChatRole
): string | null {
  const rfqId = message.rfq?.id ?? message.quotation?.rfq_id ?? null;
  if (rfqId != null) {
    return role === "seller" ? `/seller/lead/${rfqId}?from=inbox` : `/buyer/rfq/${rfqId}`;
  }

  const inquiryId = message.inquiry_id ?? message.quotation?.inquiry_id ?? null;
  if (inquiryId != null) {
    return role === "seller"
      ? `/seller/inquiries/${inquiryId}`
      : `/buyer/product-inquiries/${inquiryId}`;
  }

  const productId = message.product_id ?? message.product?.id ?? null;
  if (productId != null) {
    return role === "seller"
      ? `/seller/product/${productId}`
      : `/buyer/product/${productId}`;
  }

  return null;
}

function SystemContextLink({
  href,
  children,
}: {
  href: string | null;
  children: React.ReactNode;
}) {
  if (!href) {
    return <span className="font-bold text-foreground/75">{children}</span>;
  }
  return (
    <Link
      href={href}
      className="font-bold text-primary underline-offset-2 hover:underline"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </Link>
  );
}

function ReadTicks({ message }: { message: ApiChatMessage }) {
  if (!message.is_mine) return null;
  if (message.send_status === "sending") {
    return <Clock className="h-3.5 w-3.5 text-muted-fg" aria-label="Sending" />;
  }
  if (message.send_status === "failed") {
    return <RotateCcw className="h-3.5 w-3.5 text-error" aria-label="Failed" />;
  }
  if (message.read_at) {
    return <CheckCheck className="h-3.5 w-3.5 text-primary" aria-label="Read" />;
  }
  return <Check className="h-3.5 w-3.5 text-muted-fg" aria-label="Sent" />;
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-fg">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

export default function ChatMessageBubble({
  message,
  onRetry,
  showAvatar = false,
  showTimestamp = true,
  avatarName,
  role,
  className = "",
}: {
  message: ApiChatMessage;
  onRetry?: () => void;
  showAvatar?: boolean;
  /** When false, timestamp stays available on hover only (still rendered). */
  showTimestamp?: boolean;
  avatarName?: string | null;
  /** Portal role — used for RFQ / product deep links. */
  role?: ChatRole;
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
  const { user } = useAuth();
  const currentUserId = resolveAuthNumericUserId(user);
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
  const quoteCurrency = quote?.currency || "INR";
  const quoteBase =
    quote?.price != null && quote?.quantity != null
      ? quote.price * quote.quantity
      : null;
  const quoteGstAmount =
    quote?.gst_amount != null
      ? quote.gst_amount
      : quoteBase != null && quote?.gst_percentage != null
        ? quoteBase * (quote.gst_percentage / 100)
        : null;
  const quoteTotal =
    quote?.total_amount != null
      ? quote.total_amount
      : quoteBase != null
        ? quoteBase +
          (quoteGstAmount ?? 0) +
          (quote?.transportation_charge ?? 0)
        : null;
  const rfqId = message.rfq?.id ?? quote?.rfq_id ?? null;
  const rfqTitle = message.rfq?.title ?? quote?.rfq_title ?? null;
  const rfqHref =
    rfqId != null
      ? role === "seller"
        ? `/seller/lead/${rfqId}?from=inbox`
        : `/buyer/rfq/${rfqId}`
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
    const label = personalizeSystemMessageContent(
      message.content,
      message,
      currentUserId
    );
    const contextLabel = getSystemContextLabel(message);
    const contextHref = getSystemContextHref(message, role);
    const labelHasContext =
      Boolean(contextLabel) &&
      label.toLowerCase().includes(contextLabel!.toLowerCase());

    let body: React.ReactNode = label;
    if (contextLabel && labelHasContext) {
      const matchIndex = label.toLowerCase().indexOf(contextLabel.toLowerCase());
      const before = label.slice(0, matchIndex);
      const matched = label.slice(matchIndex, matchIndex + contextLabel.length);
      const after = label.slice(matchIndex + contextLabel.length);
      body = (
        <>
          {before}
          <SystemContextLink href={contextHref}>{matched}</SystemContextLink>
          {after}
        </>
      );
    } else if (contextLabel) {
      body = (
        <>
          <span className="block">{label}</span>
          <SystemContextLink href={contextHref}>{contextLabel}</SystemContextLink>
        </>
      );
    }

    return (
      <div className={`flex justify-center px-2 ${className}`}>
        <div className="flex max-w-[min(100%,22rem)] items-start gap-2 rounded-2xl bg-muted px-3 py-2 text-[12px] font-semibold text-muted-fg">
          <span className="mt-0.5 shrink-0">
            <SystemEventIcon content={label} />
          </span>
          <div className="min-w-0 flex-1 text-center leading-snug [overflow-wrap:anywhere]">
            {body}
            {timeLabel ? (
              <span className="mt-0.5 block text-[11px] font-medium tabular-nums text-muted-fg/80">
                {timeLabel}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  const bubbleShell = mine
    ? isText
      ? "bg-primary text-white"
      : isImage
        ? "bg-transparent p-0 shadow-none ring-0"
        : "bg-card text-foreground ring-1 ring-border"
    : isImage
      ? "bg-transparent p-0 shadow-none ring-0"
      : "bg-card text-foreground ring-1 ring-border";

  return (
    <div
      className={`group flex max-w-[88%] gap-2 ${mine ? "ml-auto flex-row-reverse" : "mr-auto"} ${className}`}
    >
      <div className="flex w-7 shrink-0 justify-center pt-0.5">
        {!mine ? (
          showAvatar ? (
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-soft text-[11px] font-bold text-primary"
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
          <p className="px-1 text-[11px] font-semibold text-muted-fg">
            {avatarName || message.sender_name || "Seller"}
          </p>
        ) : null}

        <div
          className={`rounded-2xl text-sm shadow-sm ${
            isImage ? "overflow-hidden p-0" : "px-3.5 py-2.5"
          } ${bubbleShell} ${
            message.message_type === "QUOTATION" ? "border-l-[3px] border-l-primary pl-3" : ""
          }`}
        >
          {isText ? (
            <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
          ) : null}

          {message.message_type === "PRODUCT" && message.product ? (
            <div className="flex gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-border">
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
                    <Package className="h-5 w-5 text-muted-fg" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground">
                  {message.product.name ?? `Product #${message.product.id}`}
                </p>
                {message.product.price != null ? (
                  <p className="mt-0.5 text-sm font-semibold text-primary">
                    {formatPrice(message.product.price, message.product.currency)}
                    {message.product.unit ? (
                      <span className="text-xs font-medium text-muted-fg">
                        {" "}
                        / {message.product.unit}
                      </span>
                    ) : null}
                  </p>
                ) : null}
                <Link
                  href={`/buyer/product/${message.product.id}`}
                  className="mt-1.5 inline-flex items-center gap-0.5 text-xs font-semibold text-primary hover:underline"
                >
                  View Product
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ) : null}

          {message.message_type === "QUOTATION" && quote ? (
            <div className="min-w-[220px] max-w-[280px]">
              {rfqTitle ? (
                <p className="mb-2.5 text-sm font-semibold leading-snug text-foreground">
                  {rfqTitle}
                </p>
              ) : null}
              <div className="grid grid-cols-2 gap-2.5">
                <MetaCell
                  label="Unit price"
                  value={
                    quote.price != null ? formatPrice(quote.price, quoteCurrency) : "—"
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
                  label="GST"
                  value={
                    quote.gst_percentage != null
                      ? `${quote.gst_percentage}%${
                          quoteGstAmount != null
                            ? ` (${formatPrice(quoteGstAmount, quoteCurrency)})`
                            : ""
                        }`
                      : "—"
                  }
                />
              </div>

              {quoteTotal != null ? (
                <div className="mt-2.5 rounded-lg border border-primary/15 bg-primary-soft/40 px-2.5 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-fg">
                    Total
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-primary">
                    {formatPrice(quoteTotal, quoteCurrency)}
                  </p>
                  {quoteBase != null && quote.gst_percentage != null ? (
                    <p className="mt-0.5 text-[10px] text-muted-fg">
                      {formatPrice(quoteBase, quoteCurrency)}
                      {` + ${quote.gst_percentage}% GST`}
                      {quote.transportation_charge != null &&
                      quote.transportation_charge > 0
                        ? ` + ${formatPrice(quote.transportation_charge, quoteCurrency)} transport`
                        : ""}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {quote.validity_days != null ? (
                <p className="mt-2 text-[11px] text-muted-fg">
                  Valid for {quote.validity_days} days
                </p>
              ) : null}

              {rfqHref ? (
                <Link
                  href={rfqHref}
                  className="mt-2.5 inline-flex items-center gap-0.5 text-xs font-semibold text-primary hover:underline"
                >
                  View RFQ
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              ) : null}
            </div>
          ) : null}

          {message.message_type === "IMAGE" ? (
            <div className="w-[min(240px,75vw)] overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-card)] ring-1 ring-border">
              <div className="group/media relative overflow-hidden bg-muted">
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
                      className="max-h-60 w-full object-cover transition-transform duration-300 ease-out group-hover/media:scale-[1.04]"
                      onError={() => setImageBroken(true)}
                    />
                    <span
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-foreground/15 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover/media:opacity-100"
                      aria-hidden
                    />
                  </button>
                ) : imageLoading || isUploadingImage ? (
                  <div className="flex h-32 flex-col items-center justify-center gap-2.5 text-xs font-medium text-muted-fg">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span>{isUploadingImage ? "Uploading…" : "Loading image…"}</span>
                  </div>
                ) : (
                  <div className="flex h-32 flex-col items-center justify-center gap-2 px-3 text-center text-xs font-medium text-muted-fg">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-border/50">
                      <ImageIcon className="h-4 w-4" />
                    </span>
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
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground/30 text-white opacity-90 backdrop-blur-md ring-1 ring-white/25 transition hover:bg-foreground/50 hover:opacity-100"
                      aria-label="Image options"
                      aria-expanded={imageMenuOpen}
                      aria-haspopup="menu"
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="flex items-center gap-2 border-t border-border/80 px-3 py-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-fg">
                  <ImageIcon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11.5px] font-semibold leading-tight text-foreground">
                    {imageFileName}
                  </p>
                  {formatFileSize(message.file_size) ? (
                    <p className="mt-0.5 text-[10px] leading-none text-muted-fg">
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
                        className="absolute w-40 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-[var(--shadow-elevated)]"
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
                          className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs font-semibold text-foreground transition hover:bg-muted"
                        >
                          <Eye className="h-4 w-4 shrink-0 text-muted-fg" />
                          Preview
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => void downloadImage()}
                          className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs font-semibold text-foreground transition hover:bg-muted"
                        >
                          <Download className="h-4 w-4 shrink-0 text-muted-fg" />
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
              className="flex min-w-[180px] items-center gap-2.5 rounded-xl bg-muted px-2.5 py-2 ring-1 ring-border"
            >
              <DocumentTypeIcon fileName={getChatFileDisplayName(message)} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold text-foreground">
                  {getChatFileDisplayName(message)}
                </span>
                {formatFileSize(message.file_size) ? (
                  <span className="mt-0.5 block text-[10px] text-muted-fg">
                    {formatFileSize(message.file_size)}
                  </span>
                ) : null}
              </span>
              <Download className="h-4 w-4 shrink-0 text-muted-fg" />
            </a>
          ) : null}

          {message.message_type === "PRODUCT" && !message.product ? (
            <p className="text-sm text-foreground">
              {message.content?.trim() ||
                (message.product_id != null
                  ? `Product #${message.product_id}`
                  : "Shared a product")}
            </p>
          ) : null}
          {message.message_type === "QUOTATION" && !message.quotation ? (
            <p className="text-xs text-muted-fg">Quotation #{message.quotation_id}</p>
          ) : null}
        </div>

        <div
          className={`flex items-center gap-1.5 px-1 ${
            showTimestamp ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
          }`}
        >
          <span className="text-[11px] tabular-nums text-muted-fg">{timeLabel || "—"}</span>
          <ReadTicks message={message} />
          {message.send_status === "failed" && onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="text-[10px] font-semibold text-error hover:underline"
            >
              Retry
            </button>
          ) : null}
        </div>
      </div>

      {mounted && lightboxOpen && canShowImage && imageUrl
        ? createPortal(
            <div
              className="fixed inset-0 z-[200] flex items-center justify-center bg-foreground/75 p-4"
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
                  className="flex h-9 items-center gap-1.5 rounded-lg bg-card px-3 text-xs font-semibold text-foreground shadow-sm"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-card text-foreground shadow-sm"
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
