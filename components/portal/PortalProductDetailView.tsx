"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  ChevronDown,
  Clock,
  Heart,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Play,
  Share2,
  ShoppingBag,
  Sparkles,
  Star,
  Tag,
  TrendingUp,
} from "lucide-react";
import type { ApiProductDetail, ApiProductListItem } from "@/types/catalog";
import {
  buildProductGalleryMedia,
  formatPrice,
  formatRating,
  getInitials,
  getVideoThumbnailUrl,
  productGradient,
  resolveImageUrl,
  resolveProductVideos,
  type GalleryMediaItem,
  type ResolvedProductVideo,
  whatsAppHref,
} from "@/utils/catalogHelpers";
import VideoThumb from "@/components/catalog/VideoThumb";
import {
  buildProductSpecs,
  formatSellerLocation,
  getProductDescription,
  getSellerContactPhone,
  listedDaysLabel,
} from "@/utils/productDetailHelpers";
import PortalProductCard from "@/components/portal/PortalProductCard";
import PortalSection from "@/components/portal/PortalSection";
import PortalStatCard from "@/components/portal/PortalStatCard";
import DeleteProductButton from "@/components/seller/DeleteProductButton";
import ProductApprovalBadge from "@/components/seller/ProductApprovalBadge";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/hooks/useAuth";
import { showErrorToast } from "@/utils/toast";
import {
  findMyInquiryForProduct,
  getInquiryErrorMessage,
} from "@/services/inquiryService";
import { fetchSupplierById } from "@/services/supplierService";
import { isActiveInquiryStatus } from "@/utils/inquiryHelpers";
import type { ApiSupplier } from "@/types/supplier";
import ChatSidePanel from "@/components/chat/ChatSidePanel";
import {
  approvalStatusHint,
  canSellerEditProduct,
} from "@/utils/productApprovalHelpers";
import {
  PORTAL_PRODUCT_LINKS,
  type ProductDetailLinks,
} from "@/utils/productDetailLinks";

interface PortalProductDetailViewProps {
  product: ApiProductDetail;
  similarProducts?: ApiProductListItem[];
  links?: ProductDetailLinks;
  /** Tighter layout for public website product pages */
  compact?: boolean;
}

const cardClass = "surface-card";

function IconAction({
  onClick,
  label,
  children,
  active,
  danger,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-fg transition hover:border-primary/30 hover:text-primary ${
        danger && active ? "border-error/20 bg-error-soft text-error hover:text-error" : ""
      }`}
    >
      {children}
    </button>
  );
}

function ProductGallery({
  name,
  productId,
  media,
  activeId,
  onSelect,
  fallbackPoster,
  compact = false,
}: {
  name: string;
  productId?: number;
  media: GalleryMediaItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  fallbackPoster?: string | null;
  compact?: boolean;
}) {
  const active = media.find((item) => item.id === activeId) ?? media[0] ?? null;
  const displayName = name || "Product";
  const gradient = productGradient(productId ?? 0);

  function renderVideoPlayer(video: ResolvedProductVideo, className: string) {
    if (video.type === "file") {
      const poster = getVideoThumbnailUrl(video, fallbackPoster) ?? undefined;
      return (
        <video
          key={video.key}
          src={video.src}
          poster={poster}
          controls
          playsInline
          preload="metadata"
          className={className}
        />
      );
    }

    return (
      <iframe
        key={video.key}
        src={video.embedUrl}
        title={`${displayName} video`}
        className={className}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    );
  }

  function renderVideoThumb(video: ResolvedProductVideo) {
    const thumbUrl = getVideoThumbnailUrl(video, fallbackPoster);

    if (thumbUrl) {
      return (
        <>
          <Image src={thumbUrl} alt="" fill className="object-cover" unoptimized />
          <span className="absolute inset-0 flex items-center justify-center bg-black/25">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-primary shadow">
              <Play className="ml-0.5 h-4 w-4 fill-current" />
            </span>
          </span>
        </>
      );
    }

    return <VideoThumb src={video.src} poster={null} />;
  }

  return (
    <div className={`${cardClass} ${compact ? "p-3" : "p-4 lg:p-5"}`}>
      <div className={`relative overflow-hidden rounded-xl ${compact ? "aspect-[5/4]" : "aspect-square"}`}>
        {active?.kind === "video" ? (
          <div className="absolute inset-0 bg-black">
            {renderVideoPlayer(active.video, "h-full w-full object-contain")}
          </div>
        ) : active?.kind === "image" ? (
          <Image
            src={active.src}
            alt={displayName}
            fill
            className={`object-contain ${compact ? "p-4 lg:p-6" : "p-6 lg:p-10"}`}
            unoptimized
            priority
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`}>
            <div className="flex h-full items-center justify-center">
              <span className={`font-black text-white/25 ${compact ? "text-3xl" : "text-5xl"}`}>
                {getInitials(displayName)}
              </span>
            </div>
          </div>
        )}
      </div>
      {media.length > 1 ? (
        <div className={`grid grid-cols-4 gap-2 ${compact ? "mt-3 sm:grid-cols-5" : "mt-4 sm:grid-cols-5 lg:grid-cols-5"}`}>
          {media.map((item) => {
            const isActive = active?.id === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className={`relative aspect-square overflow-hidden rounded-xl border-2 transition ${
                  isActive
                    ? "border-primary ring-2 ring-primary/15"
                    : "border-border hover:border-primary/40"
                }`}
              >
                {item.kind === "image" ? (
                  <Image src={item.src} alt="" fill className="object-cover" unoptimized />
                ) : (
                  renderVideoThumb(item.video)
                )}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function SupplierCard({
  product,
  inquiryMessage,
  supplierHref,
  compact = false,
}: {
  product: ApiProductDetail;
  inquiryMessage: string;
  supplierHref: ((sellerId: number) => string) | null;
  compact?: boolean;
}) {
  const { seller } = product;
  const contactPhone = getSellerContactPhone(product);
  const contactPhoneDisplay = seller.contact?.phone;
  const contactEmail = seller.contact?.email;

  const [supplier, setSupplier] = useState<ApiSupplier | null>(null);
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    if (!seller.id) {
      setSupplier(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const data = await fetchSupplierById(seller.id);
        if (!cancelled) setSupplier(data);
      } catch {
        if (!cancelled) setSupplier(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [seller.id]);

  const companyName =
    supplier?.company_name?.trim() || seller.company?.name || "Supplier";
  const logoUrl = resolveImageUrl(supplier?.logo ?? seller.company?.logo);
  const showLogo = Boolean(logoUrl) && !logoFailed;
  const verified = supplier?.verified === true;
  const location =
    [supplier?.city?.trim(), supplier?.state?.trim()].filter(Boolean).join(", ") ||
    formatSellerLocation(seller.location);
  const years = supplier?.years_in_business ?? seller.company?.experience_years ?? 0;
  const rating = supplier?.rating ?? seller.rating?.average ?? 0;
  const responseRate = supplier?.response_rate ?? 0;

  useEffect(() => {
    setLogoFailed(false);
  }, [logoUrl]);

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] ${
        compact ? "p-4" : "p-5 lg:p-6"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-primary/10 bg-primary-soft font-semibold text-primary ${
            compact ? "h-11 w-11 text-sm" : "h-14 w-14 text-base"
          }`}
        >
          {showLogo ? (
            <Image
              src={logoUrl as string}
              alt={companyName}
              width={56}
              height={56}
              className="h-full w-full object-cover"
              unoptimized
              onError={() => setLogoFailed(true)}
            />
          ) : (
            getInitials(companyName)
          )}
        </span>
        {verified ? (
          <span className="inline-flex items-center gap-1 rounded-lg bg-primary px-2 py-1 text-[11px] font-semibold text-white">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
            Verified
          </span>
        ) : null}
      </div>

      <p
        className={`mt-3 font-semibold tracking-tight text-foreground ${
          compact ? "text-sm" : "mt-4 text-base lg:text-lg"
        }`}
      >
        {companyName}
      </p>
      {location ? (
        <p className="mt-1.5 flex items-center gap-1 text-sm text-muted-fg">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
          {location}
        </p>
      ) : null}

      <div className={`grid grid-cols-3 gap-2 ${compact ? "mt-3" : "mt-5"}`}>
        <div className={`rounded-xl bg-primary-soft/50 text-center ${compact ? "p-2" : "p-3"}`}>
          <p className={`font-semibold text-foreground ${compact ? "text-xs" : "text-sm"}`}>
            {years}
          </p>
          <p className="mt-0.5 text-[10px] font-semibold text-muted-fg">Years in business</p>
        </div>
        <div className={`rounded-xl bg-primary-soft/50 text-center ${compact ? "p-2" : "p-3"}`}>
          <p
            className={`inline-flex items-center justify-center gap-1 font-semibold text-foreground ${
              compact ? "text-xs" : "text-sm"
            }`}
          >
            {Number(rating).toFixed(1)}
            <Star className="h-3 w-3 fill-warning text-warning" aria-hidden />
          </p>
          <p className="mt-0.5 text-[10px] font-semibold text-muted-fg">Rating</p>
        </div>
        <div className={`rounded-xl bg-primary-soft/50 text-center ${compact ? "p-2" : "p-3"}`}>
          <p className={`font-semibold text-foreground ${compact ? "text-xs" : "text-sm"}`}>
            {responseRate}%
          </p>
          <p className="mt-0.5 text-[10px] font-semibold text-muted-fg">Response rate</p>
        </div>
      </div>

      <div className={`flex flex-wrap gap-2 ${compact ? "mt-3" : "mt-5"}`}>
        {supplierHref ? (
          <Link
            href={supplierHref(seller.id)}
            className={`flex flex-1 items-center justify-center rounded-xl border border-primary/20 bg-card font-bold text-primary transition hover:border-primary/40 hover:bg-primary-soft ${
              compact ? "py-2 text-xs" : "py-2.5 text-sm"
            }`}
          >
            View Profile
          </Link>
        ) : null}
        {contactPhone ? (
          <a
            href={whatsAppHref(contactPhone, inquiryMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-success/20 bg-success-soft text-success transition hover:border-success/40"
            aria-label="Contact on WhatsApp"
          >
            <MessageCircle className="h-5 w-5" />
          </a>
        ) : null}
        {contactPhoneDisplay ? (
          <a
            href={`tel:${contactPhoneDisplay}`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-primary-soft text-primary transition hover:border-primary/30"
            aria-label="Call seller"
          >
            <Phone className="h-5 w-5" />
          </a>
        ) : null}
        {contactEmail ? (
          <a
            href={`mailto:${contactEmail}`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-warning/20 bg-warning-soft text-accent transition hover:border-warning/40"
            aria-label="Email seller"
          >
            <Mail className="h-5 w-5" />
          </a>
        ) : null}
      </div>
    </div>
  );
}

export default function PortalProductDetailView({
  product,
  similarProducts = [],
  links = PORTAL_PRODUCT_LINKS,
  compact = false,
}: PortalProductDetailViewProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [descExpanded, setDescExpanded] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInquiryId, setChatInquiryId] = useState<number | null>(null);
  const [chatConversationId, setChatConversationId] = useState<number | null>(null);
  const [openingChat, setOpeningChat] = useState(false);

  const { basic_details: basic, pricing, marketplace, ratings, user_actions } = product;
  /** True while an active (pending/quoted/accepted) inquiry exists for this product. */
  const [hasActiveInquiry, setHasActiveInquiry] = useState(
    user_actions?.is_inquiry_sent === true
  );

  useEffect(() => {
    if (!isAuthenticated || user_actions?.is_inquiry_sent !== true) {
      setHasActiveInquiry(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      const existing = await findMyInquiryForProduct(product.id);
      if (cancelled) return;
      setHasActiveInquiry(existing ? isActiveInquiryStatus(existing.status) : false);
    })();
    return () => {
      cancelled = true;
    };
  }, [product.id, isAuthenticated, user_actions?.is_inquiry_sent]);

  const hasWishlistAction = user_actions?.is_favourite != null;
  const wishlisted = isWishlisted(
    product.id,
    user_actions?.is_favourite === true
  );

  const gallery = useMemo(() => {
    const rawUrls = [
      ...(product.images.thumbnail ? [product.images.thumbnail] : []),
      ...(product.images.gallery ?? []),
    ];
    const seen = new Set<string>();
    const urls: string[] = [];

    for (const entry of rawUrls) {
      const resolved = resolveImageUrl(entry);
      if (resolved && !seen.has(resolved)) {
        seen.add(resolved);
        urls.push(resolved);
      }
    }

    return urls;
  }, [product.images]);

  const videos = useMemo(() => resolveProductVideos(product.videos), [product.videos]);

  const galleryMedia = useMemo(
    () => buildProductGalleryMedia(gallery, videos),
    [gallery, videos]
  );

  const [activeMediaId, setActiveMediaId] = useState<string | null>(galleryMedia[0]?.id ?? null);

  useEffect(() => {
    setActiveMediaId(galleryMedia[0]?.id ?? null);
  }, [product.id, galleryMedia]);

  const activeMedia =
    galleryMedia.find((item) => item.id === activeMediaId) ?? galleryMedia[0] ?? null;

  const { keySpecs, fullSpecs } = useMemo(() => buildProductSpecs(product), [product]);

  const description = getProductDescription(product);
  const showReadMore = description.length > 280;
  const displayDesc = descExpanded ? description : description.slice(0, 280);

  const isPremium = marketplace.is_featured || marketplace.is_recommended;
  const contactPhone = getSellerContactPhone(product);
  const inquiryMessage = `Hi, I'm interested in "${basic.name}" listed on TradeNexa. Please share more details.`;
  const isSellerView = Boolean(links.editProduct);
  const acceptInquiry =
    marketplace.accept_inquiry !== false && product.accept_inquiry !== false;
  const canContactSeller = user_actions?.can_contact_seller !== false;
  const inquiryAlreadySent = hasActiveInquiry;
  const showInquiryCta =
    !isSellerView && acceptInquiry && canContactSeller && links.product;
  const approvalStatus = product.approval_status ?? null;
  const displayCanEdit = canSellerEditProduct(approvalStatus);
  const displayApprovalHint = approvalStatusHint(approvalStatus);

  const thirdStatTitle = basic.brand ? "Brand" : basic.subcategory ? "Type" : "Quality";
  const thirdStatValue = basic.brand?.name ?? basic.subcategory?.name ?? "Standard";

  const handleShare = async () => {
    const url =
      marketplace.share_url ||
      (typeof window !== "undefined" ? window.location.href : "");
    try {
      if (navigator.share) {
        await navigator.share({ title: basic.name, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      showErrorToast("Could not share this product");
    }
  };

  const goSendInquiry = () => {
    if (!isAuthenticated) {
      showErrorToast("Please sign in to send an inquiry.");
      router.push("/");
      return;
    }
    router.push(`/buyer/send-inquiry?product=${product.id}`);
  };

  const openExistingInquiryChat = async () => {
    if (!isAuthenticated) {
      showErrorToast("Please sign in to continue the conversation.");
      router.push("/");
      return;
    }
    setOpeningChat(true);
    try {
      const existing = await findMyInquiryForProduct(product.id, { activeOnly: true });
      if (!existing) {
        router.push(`/buyer/send-inquiry?product=${product.id}`);
        return;
      }
      setChatInquiryId(existing.id);
      setChatConversationId(existing.conversation_id ?? null);
      setChatOpen(true);
    } catch (err) {
      showErrorToast(getInquiryErrorMessage(err, "Could not open inquiry chat"));
    } finally {
      setOpeningChat(false);
    }
  };

  return (
    <div
      className={`mx-auto px-4 sm:px-6 lg:px-8 lg:pb-6 ${links.pagePaddingClass} ${
        compact ? "max-w-6xl py-3" : "max-w-7xl py-5 lg:pb-8"
      }`}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex flex-wrap items-end justify-between gap-3 ${compact ? "mb-4" : "mb-6"}`}
      >
        <div>
          {links.back.href ? (
            <Link
              href={links.back.href}
              className={`mb-2 inline-flex items-center gap-1.5 font-semibold text-muted-fg transition hover:text-primary ${
                compact ? "text-xs" : "mb-3 text-sm"
              }`}
            >
              <ArrowLeft className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
              {links.back.label}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => router.back()}
              className={`mb-2 inline-flex items-center gap-1.5 font-semibold text-muted-fg transition hover:text-primary ${
                compact ? "text-xs" : "mb-3 text-sm"
              }`}
            >
              <ArrowLeft className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
              {links.back.label}
            </button>
          )}
          <h2
            className={`font-semibold text-foreground ${
              compact ? "text-lg sm:text-xl" : "text-xl sm:text-2xl lg:text-3xl"
            }`}
          >
            {basic.name}
          </h2>

          <div className={`flex flex-wrap items-center gap-1.5 ${compact ? "mt-1.5" : "mt-2"}`}>
            {isSellerView && approvalStatus ? (
              <ProductApprovalBadge status={approvalStatus} />
            ) : null}
            {ratings.average > 0 ? (
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-600">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {formatRating(ratings.average)}
                {ratings.total_reviews != null && ratings.total_reviews > 0
                  ? ` (${ratings.total_reviews} reviews)`
                  : ""}
              </span>
            ) : null}
            {basic.brand ? (
              <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-0.5 text-xs font-bold text-muted-fg">
                <Tag className="h-3 w-3" />
                {basic.brand.name}
              </span>
            ) : null}
            {basic.subcategory ? (
              <span className="rounded-lg bg-primary-soft px-2 py-0.5 text-xs font-bold text-primary">
                {basic.subcategory.name}
              </span>
            ) : null}
            {isPremium ? (
              <span className="inline-flex items-center gap-1 rounded-lg bg-primary-soft px-2 py-0.5 text-xs font-bold text-primary">
                <Sparkles className="h-3 w-3" />
                Premium
              </span>
            ) : null}
            {marketplace.is_trending ? (
              <span className="inline-flex items-center gap-1 rounded-lg bg-warning-soft px-2 py-0.5 text-xs font-bold text-accent">
                <TrendingUp className="h-3 w-3" />
                Trending
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {links.editProduct && displayCanEdit ? (
            <Link
              href={links.editProduct(product.id)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-foreground transition-colors duration-200 hover:border-primary hover:text-primary"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Link>
          ) : null}
          {links.editProduct ? (
            <DeleteProductButton
              productId={product.id}
              productName={basic.name ?? "this product"}
            />
          ) : null}
          <IconAction onClick={() => void handleShare()} label="Share">
            <Share2 className="h-4 w-4" />
          </IconAction>
          {hasWishlistAction ? (
            <IconAction
              onClick={() => void toggleWishlist(product.id, wishlisted)}
              label="Wishlist"
              active={wishlisted}
              danger
            >
              <Heart className={`h-4 w-4 ${wishlisted ? "fill-error text-error" : ""}`} />
            </IconAction>
          ) : null}
        </div>
      </motion.div>

      {isSellerView && approvalStatus ? (
        <div
          className={`mb-4 rounded-xl border px-4 py-3 ${
            approvalStatus === "rejected"
              ? "border-error/20 bg-error-soft"
              : approvalStatus === "revision_required"
                ? "border-warning/25 bg-warning-soft"
                : approvalStatus === "approved"
                  ? "border-success/20 bg-success-soft"
                  : "border-warning/20 bg-warning-soft"
          }`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <ProductApprovalBadge status={approvalStatus} />
            {displayApprovalHint ? (
              <p className="text-sm text-foreground/80">{displayApprovalHint}</p>
            ) : null}
          </div>
          {product.latest_review_remarks ? (
            <p className="mt-2 text-sm text-foreground">
              <span className="font-semibold">Admin remarks: </span>
              {product.latest_review_remarks}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className={`grid grid-cols-1 lg:grid-cols-12 ${compact ? "gap-4 lg:gap-5" : "gap-6 lg:gap-8"}`}>
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-4">
            <ProductGallery
              name={basic.name ?? ""}
              productId={product.id}
              media={galleryMedia}
              activeId={activeMedia?.id ?? null}
              onSelect={setActiveMediaId}
              fallbackPoster={gallery[0] ?? null}
              compact={compact}
            />
          </div>
        </div>

        <div className={`lg:col-span-7 ${compact ? "space-y-4" : "space-y-6"}`}>
          <div
            className={`overflow-hidden rounded-xl bg-gradient-to-br from-primary to-primary-hover text-white ${
              compact ? "p-4" : "p-6"
            }`}
          >
            <p className={`text-white/80 ${compact ? "text-xs" : "text-sm"}`}>Wholesale B2B Price</p>
            <p className={`mt-1 font-semibold ${compact ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl"}`}>
              {formatPrice(pricing.price)}
              <span
                className={`ml-2 font-semibold text-white/80 ${compact ? "text-sm" : "text-base"}`}
              >
                / {pricing.unit}
              </span>
            </p>
            {pricing.gst_percentage != null ? (
              <p className="mt-2 text-xs text-white/70">
                GST: {pricing.gst_percentage}%
                {pricing.gst_included ? " (included)" : ""}
              </p>
            ) : null}
            <p className="mt-3 text-xs text-white/70">
              Prices are indicative and subject to order volume negotiations.
            </p>
          </div>

          <div className={`grid grid-cols-2 gap-2 sm:grid-cols-3 ${compact ? "gap-2" : "gap-3"}`}>
            <PortalStatCard
              title="Min. Order"
              value={`${pricing.minimum_order_quantity} ${pricing.unit}`}
              icon={ShoppingBag}
              color="text-primary"
              bg="bg-primary-soft"
              compact={compact}
            />
            <PortalStatCard
              title="Listed"
              value={listedDaysLabel(product.created_at)}
              icon={Clock}
              color="text-success"
              bg="bg-success-soft"
              compact={compact}
            />
            <PortalStatCard
              title={thirdStatTitle}
              value={thirdStatValue}
              icon={BadgeCheck}
              color="text-accent"
              bg="bg-warning-soft"
              compact={compact}
            />
          </div>

          {showInquiryCta ? (
            <div className="hidden lg:flex flex-wrap gap-2">
              {inquiryAlreadySent ? (
                <button
                  type="button"
                  onClick={() => void openExistingInquiryChat()}
                  disabled={openingChat}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-60"
                >
                  <MessageCircle className="h-4 w-4" />
                  {openingChat ? "Opening…" : "Continue chat"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goSendInquiry}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
                >
                  <MessageCircle className="h-4 w-4" />
                  Send Inquiry
                </button>
              )}
              {contactPhone ? (
                <a
                  href={whatsAppHref(contactPhone, inquiryMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-success/20 bg-card px-6 py-3 text-sm font-semibold text-success transition hover:border-success/40 hover:bg-success-soft"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
              ) : null}
            </div>
          ) : contactPhone ? (
            <div className="hidden lg:flex">
              <a
                href={whatsAppHref(contactPhone, inquiryMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-success/20 bg-card px-6 py-3 text-sm font-semibold text-success transition hover:border-success/40 hover:bg-success-soft"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp Seller
              </a>
            </div>
          ) : null}

          {keySpecs.length > 0 ? (
            <div className={`${cardClass} hidden lg:block ${compact ? "p-4" : "p-5"}`}>
              <h3 className={`mb-3 font-semibold text-foreground ${compact ? "text-sm" : "mb-4 text-base"}`}>
                Key Specifications
              </h3>
              <div className={`grid grid-cols-2 gap-2 xl:grid-cols-3 ${compact ? "gap-2" : "gap-3"}`}>
                {keySpecs.map((spec) => (
                  <div key={spec.label} className={`rounded-xl bg-muted ${compact ? "px-3 py-2" : "px-4 py-3"}`}>
                    <p className={`font-semibold text-muted-fg ${compact ? "text-[10px]" : "text-xs"}`}>
                      {spec.label}
                    </p>
                    <p className={`mt-0.5 font-semibold text-foreground ${compact ? "text-xs" : "text-sm"}`}>
                      {spec.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className={`grid grid-cols-1 lg:grid-cols-12 ${compact ? "mt-5 gap-5" : "mt-8 gap-8"}`}>
        <div className={`lg:col-span-8 ${compact ? "space-y-5" : "space-y-8"}`}>
          {keySpecs.length > 0 ? (
            <PortalSection title="Key Specifications" subtitle="From product details" compact={compact}>
              <div className="flex gap-3 overflow-x-auto pb-1 lg:hidden">
                {keySpecs.map((spec) => (
                  <div key={spec.label} className={`${cardClass} shrink-0 px-4 py-3`}>
                    <p className="text-xs font-semibold text-muted-fg">{spec.label}</p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">{spec.value}</p>
                  </div>
                ))}
              </div>
            </PortalSection>
          ) : null}

          <PortalSection title="About this Product" compact={compact}>
            <div className={`${cardClass} ${compact ? "p-4" : "p-5 lg:p-6"}`}>
              {description ? (
                <>
                  <p className={`leading-relaxed text-muted-fg ${compact ? "text-xs" : "text-sm lg:text-base"}`}>
                    {displayDesc}
                    {!descExpanded && showReadMore ? "…" : ""}
                  </p>
                  {showReadMore ? (
                    <button
                      type="button"
                      onClick={() => setDescExpanded((v) => !v)}
                      className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary"
                    >
                      {descExpanded ? "Show less" : "Read More"}
                      <ChevronDown
                        className={`h-4 w-4 transition ${descExpanded ? "rotate-180" : ""}`}
                      />
                    </button>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-muted-fg">
                  No description provided by the seller yet.
                </p>
              )}
            </div>
          </PortalSection>

          {fullSpecs.length > 0 ? (
            <PortalSection title="Product Specifications" compact={compact}>
              <div className={`${cardClass} overflow-hidden`}>
                {fullSpecs.map((spec, i) => (
                  <div
                    key={`${spec.label}-${i}`}
                    className={`grid grid-cols-2 gap-3 ${
                      compact ? "px-4 py-2.5" : "gap-4 px-5 py-3.5"
                    } ${
                      i < fullSpecs.length - 1 ? "border-b border-border" : ""
                    } ${i % 2 === 0 ? "bg-card" : "bg-muted"}`}
                  >
                    <span className="text-sm text-muted-fg">{spec.label}</span>
                    <span className="text-sm font-bold text-foreground">{spec.value}</span>
                  </div>
                ))}
              </div>
            </PortalSection>
          ) : null}

          {similarProducts.length > 0 ? (
            <PortalSection
              title="Similar Products"
              subtitle={
                basic.subcategory
                  ? `More in ${basic.subcategory.name}`
                  : basic.category
                    ? `More in ${basic.category.name}`
                    : "Related products"
              }
              compact={compact}
              action={
                links.category || product.basic_details.category ? (
                  <Link
                    href={
                      links.category ??
                      `/buyer/category/${product.basic_details.category!.id}`
                    }
                    className="text-sm font-bold text-primary"
                  >
                    View all
                  </Link>
                ) : (
                  <Link href={links.search} className="text-sm font-bold text-primary">
                    View all
                  </Link>
                )
              }
            >
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {similarProducts.map((item) => (
                  <PortalProductCard
                    key={item.id}
                    product={item}
                    href={links.product(item.id)}
                    subcategoryLabel={basic.subcategory?.name}
                  />
                ))}
              </div>
            </PortalSection>
          ) : null}
        </div>

        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-4">
            <PortalSection title="Supplier" subtitle={product.seller.company?.name} compact={compact}>
              <SupplierCard
                product={product}
                inquiryMessage={inquiryMessage}
                supplierHref={links.supplier}
                compact={compact}
              />
            </PortalSection>
          </div>
        </div>
      </div>

      <div
        className={`fixed left-0 right-0 z-30 border-t border-border bg-card/95 px-4 py-3 backdrop-blur-md lg:hidden ${links.mobileBarClass}`}
      >
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <IconAction onClick={() => void handleShare()} label="Share">
            <Share2 className="h-4 w-4" />
          </IconAction>
          {hasWishlistAction ? (
            <IconAction
              onClick={() => void toggleWishlist(product.id, wishlisted)}
              label="Wishlist"
              active={wishlisted}
              danger
            >
              <Heart className={`h-4 w-4 ${wishlisted ? "fill-error text-error" : ""}`} />
            </IconAction>
          ) : null}
          {showInquiryCta ? (
            inquiryAlreadySent ? (
              <button
                type="button"
                onClick={() => void openExistingInquiryChat()}
                disabled={openingChat}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-60"
              >
                <MessageCircle className="h-4 w-4" />
                {openingChat ? "Opening…" : "Continue chat"}
              </button>
            ) : (
              <button
                type="button"
                onClick={goSendInquiry}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-white transition hover:bg-primary/90"
              >
                <MessageCircle className="h-4 w-4" />
                Send Inquiry
              </button>
            )
          ) : contactPhone ? (
            <a
              href={whatsAppHref(contactPhone, inquiryMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-success/20 bg-success-soft py-3.5 text-sm font-semibold text-success transition hover:border-success/40"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp Seller
            </a>
          ) : null}
        </div>
      </div>

      <ChatSidePanel
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        title="Chat with Seller"
        role="buyer"
        inquiryId={chatInquiryId}
        conversationId={chatConversationId}
        productId={product.id}
        productName={basic.name}
        otherPartyName={product.seller?.company?.name}
        otherPartyLogo={product.seller?.company?.logo}
      />
    </div>
  );
}
