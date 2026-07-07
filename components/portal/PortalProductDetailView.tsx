"use client";

import React, { useMemo, useState } from "react";
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
  Package,
  Phone,
  Share2,
  ShoppingBag,
  Sparkles,
  Star,
  Tag,
  TrendingUp,
} from "lucide-react";
import type { ApiProductDetail, ApiProductListItem } from "@/types/catalog";
import {
  formatPrice,
  formatRating,
  getInitials,
  resolveImageUrl,
  whatsAppHref,
} from "@/utils/catalogHelpers";
import {
  buildProductSpecs,
  formatSellerLocation,
  getExperienceLabel,
  getProductDescription,
  getSellerContactPhone,
  getSellerRole,
  listedDaysLabel,
} from "@/utils/productDetailHelpers";
import PortalProductCard from "@/components/portal/PortalProductCard";
import PortalSection from "@/components/portal/PortalSection";
import PortalStatCard from "@/components/portal/PortalStatCard";
import { useWishlist } from "@/hooks/useWishlist";
import { showErrorToast } from "@/utils/toast";
import {
  PORTAL_PRODUCT_LINKS,
  type ProductDetailLinks,
} from "@/utils/productDetailLinks";

interface PortalProductDetailViewProps {
  product: ApiProductDetail;
  similarProducts?: ApiProductListItem[];
}

const cardClass = "rounded-2xl border border-[#E8ECF0] bg-white shadow-sm";

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
      className={`flex h-10 w-10 items-center justify-center rounded-xl border border-[#E8ECF0] bg-white text-[#546E7A] shadow-sm transition hover:border-[#1565C0]/30 hover:text-[#1565C0] ${
        danger && active ? "border-red-200 bg-red-50 text-red-500 hover:text-red-500" : ""
      }`}
    >
      {children}
    </button>
  );
}

function ProductGallery({
  name,
  gallery,
  heroImage,
  onSelect,
}: {
  name: string;
  gallery: string[];
  heroImage: string | null;
  onSelect: (url: string) => void;
}) {
  return (
    <div className={`${cardClass} p-4 lg:p-5`}>
      <div className="relative aspect-square overflow-hidden rounded-xl bg-[#F4F6F9]">
        {heroImage ? (
          <Image
            src={heroImage}
            alt={name}
            fill
            className="object-contain p-6 lg:p-10"
            unoptimized
            priority
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-[#B0BEC5]">
            <Package className="h-16 w-16 opacity-40" strokeWidth={1.25} />
            <span className="text-3xl font-black opacity-30">{getInitials(name)}</span>
            <span className="text-xs font-medium text-[#90A4AE]">No image available</span>
          </div>
        )}
      </div>
      {gallery.length > 1 ? (
        <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-5">
          {gallery.map((url) => (
            <button
              key={url}
              type="button"
              onClick={() => onSelect(url)}
              className={`relative aspect-square overflow-hidden rounded-xl border-2 transition ${
                heroImage === url
                  ? "border-[#1565C0] ring-2 ring-[#1565C0]/15"
                  : "border-[#E8ECF0] hover:border-[#1565C0]/40"
              }`}
            >
              <Image src={url} alt="" fill className="object-cover" unoptimized />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SupplierCard({
  product,
  inquiryMessage,
  supplierHref,
}: {
  product: ApiProductDetail;
  inquiryMessage: string;
  supplierHref: ((sellerId: number) => string) | null;
}) {
  const { seller } = product;
  const location = formatSellerLocation(seller.location);
  const role = getSellerRole(product);
  const logoUrl = resolveImageUrl(seller.company.logo);
  const contactPhone = getSellerContactPhone(product);
  const experienceLabel = getExperienceLabel(product);
  const locationLine = [location, role].filter(Boolean).join(" • ");

  return (
    <div className={`${cardClass} p-5 lg:p-6`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#E8EFF9] text-base font-extrabold text-[#1565C0]">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={seller.company.name}
              width={48}
              height={48}
              className="h-full w-full object-cover"
              unoptimized
            />
          ) : (
            getInitials(seller.company.name)
          )}
        </div>
        <BadgeCheck className="h-5 w-5 shrink-0 text-[#1565C0]" />
      </div>

      <p className="mt-4 text-base font-extrabold text-[#0D1B2A] lg:text-lg">{seller.company.name}</p>
      {locationLine ? (
        <p className="mt-1 flex items-start gap-1 text-sm text-[#546E7A]">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {locationLine}
        </p>
      ) : null}

      <div className="mt-5 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-[#F4F6F9] p-3 text-center">
          <p className="text-sm font-extrabold text-[#0D1B2A]">{experienceLabel}</p>
          <p className="mt-0.5 text-[10px] font-semibold text-[#546E7A]">Experience</p>
        </div>
        <div className="rounded-xl bg-[#F4F6F9] p-3 text-center">
          <p className="text-sm font-extrabold text-[#0D1B2A]">
            {formatRating(seller.rating.average)}{" "}
            <Star className="inline h-3 w-3 fill-amber-400 text-amber-400" />
          </p>
          <p className="mt-0.5 text-[10px] font-semibold text-[#546E7A]">Seller Rating</p>
        </div>
        <div className="rounded-xl bg-[#F4F6F9] p-3 text-center">
          <p className="text-sm font-extrabold text-[#0D1B2A]">
            {seller.rating.total_reviews != null && seller.rating.total_reviews > 0
              ? seller.rating.total_reviews
              : "—"}
          </p>
          <p className="mt-0.5 text-[10px] font-semibold text-[#546E7A]">Reviews</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {supplierHref ? (
          <Link
            href={supplierHref(seller.id)}
            className="flex flex-1 items-center justify-center rounded-xl border border-[#E0E6ED] py-2.5 text-sm font-bold text-[#1565C0] transition hover:border-[#1565C0]/40 hover:bg-[#E8EFF9]"
          >
            View Profile
          </Link>
        ) : null}
        {contactPhone ? (
          <a
            href={whatsAppHref(contactPhone, inquiryMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E0E6ED] bg-emerald-50 text-emerald-600 transition hover:border-emerald-300"
            aria-label="Contact on WhatsApp"
          >
            <MessageCircle className="h-5 w-5" />
          </a>
        ) : null}
        {seller.contact.phone ? (
          <a
            href={`tel:${seller.contact.phone}`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E0E6ED] bg-blue-50 text-[#1565C0] transition hover:border-[#1565C0]/30"
            aria-label="Call seller"
          >
            <Phone className="h-5 w-5" />
          </a>
        ) : null}
        {seller.contact.email ? (
          <a
            href={`mailto:${seller.contact.email}`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E0E6ED] bg-orange-50 text-[#FF6D00] transition hover:border-orange-200"
            aria-label="Email seller"
          >
            <Mail className="h-5 w-5" />
          </a>
        ) : null}
      </div>
    </div>
  );
}

interface PortalProductDetailViewProps {
  product: ApiProductDetail;
  similarProducts?: ApiProductListItem[];
  links?: ProductDetailLinks;
}

export default function PortalProductDetailView({
  product,
  similarProducts = [],
  links = PORTAL_PRODUCT_LINKS,
}: PortalProductDetailViewProps) {
  const router = useRouter();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [descExpanded, setDescExpanded] = useState(false);

  const { basic_details: basic, pricing, marketplace, ratings } = product;
  const wishlisted = isWishlisted(product.id);

  const gallery = useMemo(() => {
    const urls = [
      ...(product.images.thumbnail ? [product.images.thumbnail] : []),
      ...(product.images.gallery ?? []),
    ].filter((url, i, arr) => arr.indexOf(url) === i);
    return urls.map((url) => resolveImageUrl(url)).filter(Boolean) as string[];
  }, [product.images]);

  const [activeImage, setActiveImage] = useState<string | null>(gallery[0] ?? null);
  const heroImage = activeImage ?? gallery[0] ?? null;

  const { keySpecs, fullSpecs } = useMemo(() => buildProductSpecs(product), [product]);

  const description = getProductDescription(product);
  const showReadMore = description.length > 280;
  const displayDesc = descExpanded ? description : description.slice(0, 280);

  const isPremium = marketplace.is_featured || marketplace.is_recommended;
  const contactPhone = getSellerContactPhone(product);
  const inquiryMessage = `Hi, I'm interested in "${basic.name}" (Product ID: ${product.id}) listed on TradeNexa. Please share more details.`;

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

  return (
    <div
      className={`mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:pb-8 ${links.pagePaddingClass}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-wrap items-end justify-between gap-3"
      >
        <div>
          {links.back.href ? (
            <Link
              href={links.back.href}
              className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#546E7A] transition hover:text-[#1565C0]"
            >
              <ArrowLeft className="h-4 w-4" />
              {links.back.label}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => router.back()}
              className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#546E7A] transition hover:text-[#1565C0]"
            >
              <ArrowLeft className="h-4 w-4" />
              {links.back.label}
            </button>
          )}
          <h2 className="text-xl font-extrabold text-[#0D1B2A] sm:text-2xl lg:text-3xl">{basic.name}</h2>

          <div className="mt-2 flex flex-wrap items-center gap-2">
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
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#F4F6F9] px-2 py-0.5 text-xs font-bold text-[#546E7A]">
                <Tag className="h-3 w-3" />
                {basic.brand.name}
              </span>
            ) : null}
            {basic.subcategory ? (
              <span className="rounded-lg bg-[#E8EFF9] px-2 py-0.5 text-xs font-bold text-[#1565C0]">
                {basic.subcategory.name}
              </span>
            ) : null}
            {isPremium ? (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#E8EFF9] px-2 py-0.5 text-xs font-bold text-[#1565C0]">
                <Sparkles className="h-3 w-3" />
                Premium
              </span>
            ) : null}
            {marketplace.is_trending ? (
              <span className="inline-flex items-center gap-1 rounded-lg bg-orange-50 px-2 py-0.5 text-xs font-bold text-[#FF6D00]">
                <TrendingUp className="h-3 w-3" />
                Trending
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <IconAction onClick={() => void handleShare()} label="Share">
            <Share2 className="h-4 w-4" />
          </IconAction>
          <IconAction
            onClick={() => toggleWishlist(product.id)}
            label="Wishlist"
            active={wishlisted}
            danger
          >
            <Heart className={`h-4 w-4 ${wishlisted ? "fill-red-500 text-red-500" : ""}`} />
          </IconAction>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-6">
            <ProductGallery
              name={basic.name}
              gallery={gallery}
              heroImage={heroImage}
              onSelect={setActiveImage}
            />
          </div>
        </div>

        <div className="space-y-6 lg:col-span-7">
          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#1565C0] to-[#5E92F3] p-6 text-white shadow-lg shadow-[#1565C0]/20">
            <p className="text-sm text-white/80">Wholesale B2B Price</p>
            <p className="mt-1 text-3xl font-extrabold sm:text-4xl">
              {formatPrice(pricing.price)}
              <span className="ml-2 text-base font-semibold text-white/80">/ {pricing.unit}</span>
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

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <PortalStatCard
              title="Min. Order"
              value={`${pricing.minimum_order_quantity} ${pricing.unit}`}
              icon={ShoppingBag}
              color="text-[#1565C0]"
              bg="bg-blue-50"
            />
            <PortalStatCard
              title="Listed"
              value={listedDaysLabel(product.created_at)}
              icon={Clock}
              color="text-[#2E7D32]"
              bg="bg-emerald-50"
            />
            <PortalStatCard
              title={thirdStatTitle}
              value={thirdStatValue}
              icon={BadgeCheck}
              color="text-[#FF6D00]"
              bg="bg-orange-50"
            />
          </div>

          {contactPhone ? (
            <div className="hidden lg:flex">
              <a
                href={whatsAppHref(contactPhone, inquiryMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E0E6ED] bg-white px-6 py-3 text-sm font-bold text-emerald-600 transition hover:border-emerald-300 hover:bg-emerald-50"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp Seller
              </a>
            </div>
          ) : null}

          {keySpecs.length > 0 ? (
            <div className={`${cardClass} hidden p-5 lg:block`}>
              <h3 className="mb-4 text-base font-extrabold text-[#0D1B2A]">Key Specifications</h3>
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
                {keySpecs.map((spec) => (
                  <div key={spec.label} className="rounded-xl bg-[#F4F6F9] px-4 py-3">
                    <p className="text-xs font-semibold text-[#546E7A]">{spec.label}</p>
                    <p className="mt-0.5 text-sm font-extrabold text-[#0D1B2A]">{spec.value}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-8">
          {keySpecs.length > 0 ? (
            <PortalSection title="Key Specifications" subtitle="From product details">
              <div className="flex gap-3 overflow-x-auto pb-1 lg:hidden">
                {keySpecs.map((spec) => (
                  <div key={spec.label} className={`${cardClass} shrink-0 px-4 py-3`}>
                    <p className="text-xs font-semibold text-[#546E7A]">{spec.label}</p>
                    <p className="mt-0.5 text-sm font-extrabold text-[#0D1B2A]">{spec.value}</p>
                  </div>
                ))}
              </div>
            </PortalSection>
          ) : null}

          <PortalSection title="About this Product">
            <div className={`${cardClass} p-5 lg:p-6`}>
              {description ? (
                <>
                  <p className="text-sm leading-relaxed text-[#546E7A] lg:text-base">
                    {displayDesc}
                    {!descExpanded && showReadMore ? "…" : ""}
                  </p>
                  {showReadMore ? (
                    <button
                      type="button"
                      onClick={() => setDescExpanded((v) => !v)}
                      className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#1565C0]"
                    >
                      {descExpanded ? "Show less" : "Read More"}
                      <ChevronDown
                        className={`h-4 w-4 transition ${descExpanded ? "rotate-180" : ""}`}
                      />
                    </button>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-[#90A4AE]">
                  No description provided by the seller yet.
                </p>
              )}
            </div>
          </PortalSection>

          {fullSpecs.length > 0 ? (
            <PortalSection title="Product Specifications">
              <div className={`${cardClass} overflow-hidden`}>
                {fullSpecs.map((spec, i) => (
                  <div
                    key={`${spec.label}-${i}`}
                    className={`grid grid-cols-2 gap-4 px-5 py-3.5 ${
                      i < fullSpecs.length - 1 ? "border-b border-[#E8ECF0]" : ""
                    } ${i % 2 === 0 ? "bg-white" : "bg-[#FAFBFC]"}`}
                  >
                    <span className="text-sm text-[#546E7A]">{spec.label}</span>
                    <span className="text-sm font-bold text-[#0D1B2A]">{spec.value}</span>
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
              action={
                links.category || product.basic_details.category ? (
                  <Link
                    href={
                      links.category ??
                      `/buyer/category/${product.basic_details.category!.id}`
                    }
                    className="text-sm font-bold text-[#1565C0]"
                  >
                    View all
                  </Link>
                ) : (
                  <Link href={links.search} className="text-sm font-bold text-[#1565C0]">
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
          <div className="lg:sticky lg:top-6">
            <PortalSection title="Supplier" subtitle={product.seller.company.name}>
              <SupplierCard
                product={product}
                inquiryMessage={inquiryMessage}
                supplierHref={links.supplier}
              />
            </PortalSection>
          </div>
        </div>
      </div>

      <div
        className={`fixed left-0 right-0 z-30 border-t border-[#E0E6ED] bg-white/95 px-4 py-3 backdrop-blur-md lg:hidden ${links.mobileBarClass}`}
      >
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <IconAction onClick={() => void handleShare()} label="Share">
            <Share2 className="h-4 w-4" />
          </IconAction>
          <IconAction
            onClick={() => toggleWishlist(product.id)}
            label="Wishlist"
            active={wishlisted}
            danger
          >
            <Heart className={`h-4 w-4 ${wishlisted ? "fill-red-500 text-red-500" : ""}`} />
          </IconAction>
          {contactPhone ? (
            <a
              href={whatsAppHref(contactPhone, inquiryMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-3.5 text-sm font-bold text-emerald-600 transition hover:border-emerald-300"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp Seller
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
