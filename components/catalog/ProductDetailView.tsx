"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import CatalogBreadcrumbs from "@/components/catalog/CatalogBreadcrumbs";
import type { ApiProductDetail } from "@/types/catalog";
import type { CatalogPathContext } from "@/services/catalogService";
import { resolveCatalogPaths } from "@/services/catalogService";
import {
  formatListedAgo,
  formatLocation,
  formatPrice,
  formatRating,
  getInitials,
  resolveImageUrl,
  whatsAppHref,
} from "@/utils/catalogHelpers";
import { getMarketplaceTheme } from "@/utils/marketplaceTheme";
import {
  ArrowLeft,
  BadgeCheck,
  ChevronDown,
  Clock,
  Heart,
  MessageCircle,
  Package,
  Phone,
  Share2,
  ShoppingBag,
  Sparkles,
  Star,
} from "lucide-react";
import { showErrorToast } from "@/utils/toast";

interface ProductDetailViewProps {
  product: ApiProductDetail;
}

interface SpecRow {
  label: string;
  value: string;
  href?: string;
}

function StarRating({ rating, reviews }: { rating: number; reviews?: number | null }) {
  const fullStars = Math.round(rating);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < fullStars ? "fill-slate-500 text-slate-500" : "fill-slate-200 text-slate-200"
            }`}
          />
        ))}
      </div>
      <span className="text-sm font-bold text-[#1a2b4c]">{formatRating(rating)}</span>
      {reviews != null && reviews > 0 && (
        <span className="text-sm text-slate-500">({reviews} reviews)</span>
      )}
    </div>
  );
}

function SellerProfileCard({
  product,
  contactHref,
}: {
  product: ApiProductDetail;
  contactHref: string;
}) {
  const { seller } = product;
  const location = formatLocation(
    seller.location.city,
    seller.location.state,
    seller.location.country
  );
  const role = seller.company.business_type ?? "Seller";
  const logoUrl = resolveImageUrl(seller.company.logo);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary text-lg font-bold text-white shadow-md">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={seller.company.name}
              width={56}
              height={56}
              className="h-full w-full object-cover"
              unoptimized
            />
          ) : (
            getInitials(seller.company.name)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="text-base font-bold text-[#1a2b4c]">{seller.company.name}</h3>
            <BadgeCheck className="h-5 w-5 shrink-0 text-primary" />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {location} • {role}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3 border-y border-slate-100 py-5">
        <div className="text-center">
          <p className="text-lg font-extrabold text-primary">
            {seller.company.experience_years > 0
              ? `${seller.company.experience_years} Yrs`
              : seller.company.year_established
                ? `${new Date().getFullYear() - seller.company.year_established}+ Yrs`
                : "—"}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-slate-400">Active Since</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-extrabold text-primary">
            {formatRating(seller.rating.average)}{" "}
            <Star className="inline h-3.5 w-3.5 fill-slate-500 text-slate-500" />
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-slate-400">Rating</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-extrabold text-primary">
            {seller.rating.total_reviews != null && seller.rating.total_reviews > 0
              ? seller.rating.total_reviews
              : "—"}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-slate-400">Reviews</p>
        </div>
      </div>

      <Link
        href={contactHref}
        className="mt-5 flex w-full items-center justify-center rounded-xl py-2.5 text-sm font-bold text-primary transition hover:bg-primary/5"
      >
        View Profile
      </Link>
    </div>
  );
}

export default function ProductDetailView({ product }: ProductDetailViewProps) {
  const { basic_details: basic, pricing, seller, marketplace, ratings } = product;
  const theme = getMarketplaceTheme(product.id);

  const gallery = useMemo(
    () =>
      [
        ...(product.images.thumbnail ? [product.images.thumbnail] : []),
        ...(product.images.gallery ?? []),
      ]
        .filter((url, i, arr) => arr.indexOf(url) === i)
        .map((url) => resolveImageUrl(url) ?? url),
    [product.images]
  );

  const [activeImage, setActiveImage] = useState<string | null>(gallery[0] ?? null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [catalogPaths, setCatalogPaths] = useState<CatalogPathContext | null>(null);

  useEffect(() => {
    if (!basic.category?.id) {
      setCatalogPaths(null);
      return;
    }

    let cancelled = false;
    void resolveCatalogPaths(basic.category.id, basic.subcategory?.id).then((paths) => {
      if (!cancelled) setCatalogPaths(paths);
    });

    return () => {
      cancelled = true;
    };
  }, [basic.category?.id, basic.subcategory?.id]);

  const breadcrumbItems = [
    { label: "Categories", href: "/categories" },
    ...(basic.category
      ? [
          {
            label: basic.category.name,
            href: catalogPaths?.categoryHref ?? `/categories`,
          },
        ]
      : []),
    ...(basic.subcategory
      ? [
          {
            label: basic.subcategory.name,
            href: catalogPaths?.subcategoryHref ?? catalogPaths?.categoryHref ?? "/categories",
          },
        ]
      : []),
    { label: basic.name },
  ];

  const inquiryMessage = `Hi, I'm interested in "${basic.name}" listed on TradeNexa. Please share more details.`;
  const contactHref = `/contact?product=${encodeURIComponent(basic.name)}&seller=${encodeURIComponent(seller.company.name)}`;
  const phone = seller.contact.phone;
  const whatsapp = seller.contact.whatsapp || seller.contact.phone;

  const handleShare = async () => {
    const url = marketplace.share_url || window.location.href;
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

  const keySpecs: SpecRow[] = [
    basic.category && {
      label: "Category",
      value: basic.category.name,
      href: catalogPaths?.categoryHref,
    },
    basic.subcategory && {
      label: "Subcategory",
      value: basic.subcategory.name,
      href: catalogPaths?.subcategoryHref,
    },
    basic.brand && { label: "Brand", value: basic.brand.name },
    basic.country_of_origin && { label: "Origin", value: basic.country_of_origin },
    pricing.hsn_code && { label: "HSN Code", value: pricing.hsn_code },
    pricing.price_type && { label: "Price Type", value: pricing.price_type },
    pricing.gst_percentage != null && {
      label: "GST",
      value: `${pricing.gst_percentage}%${pricing.gst_included ? " (incl.)" : ""}`,
    },
  ].filter(Boolean) as SpecRow[];

  const fullSpecs: SpecRow[] = [
    ...keySpecs,
    { label: "Min. Order", value: `${pricing.minimum_order_quantity} ${pricing.unit}` },
    { label: "Unit", value: pricing.unit },
    { label: "Listed", value: formatListedAgo(product.created_at) },
  ];

  const description = basic.description || basic.short_description || "";
  const shortDesc = basic.short_description || basic.description || "";
  const showReadMore = description.length > 220;
  const displayDesc = descExpanded ? description : shortDesc.slice(0, 220);

  const isPremium = marketplace.is_featured || marketplace.is_recommended;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur-md lg:hidden">
        <Link
          href="/products"
          className="flex h-10 w-10 items-center justify-center rounded-full text-primary"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void handleShare()}
            className="flex h-10 w-10 items-center justify-center rounded-full text-primary"
            aria-label="Share"
          >
            <Share2 className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full text-primary"
            aria-label="Wishlist"
          >
            <Heart className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-6 hidden lg:block">
          <CatalogBreadcrumbs items={breadcrumbItems} />
        </div>

        {/* Hero: image + summary */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10 xl:gap-14">
          {/* Gallery */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-24">
              <div className={`relative aspect-square overflow-hidden rounded-2xl ${theme.pastel} lg:rounded-3xl`}>
                {basic.category && (
                  <span className="absolute left-4 top-4 z-10 rounded-lg bg-primary/90 px-3 py-1.5 text-xs font-bold text-white shadow-sm">
                    {basic.category.name}
                  </span>
                )}

                {activeImage ? (
                  <Image
                    src={activeImage}
                    alt={basic.name}
                    fill
                    className="object-contain p-8 lg:p-12"
                    unoptimized
                    priority
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 p-8">
                    <Package className={`h-20 w-20 ${theme.iconText} opacity-30`} strokeWidth={1.25} />
                    <span className={`text-sm font-semibold ${theme.iconText} opacity-40`}>
                      {getInitials(basic.name)}
                    </span>
                  </div>
                )}
              </div>

              {gallery.length > 1 && (
                <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                  {gallery.map((url) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setActiveImage(url)}
                      className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition lg:h-20 lg:w-20 ${
                        activeImage === url
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <Image src={url} alt="" fill className="object-cover" unoptimized />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product summary */}
          <div className="lg:col-span-7">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {isPremium && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                    <Sparkles className="h-3.5 w-3.5" />
                    Premium
                  </span>
                )}
                {marketplace.is_trending && (
                  <span className="rounded-lg bg-[#1a3a5c]/10 px-2.5 py-1 text-xs font-bold text-[#1a3a5c]">
                    Trending
                  </span>
                )}
              </div>
              <div className="hidden items-center gap-2 lg:flex">
                <button
                  type="button"
                  onClick={() => void handleShare()}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-primary shadow-sm transition hover:bg-slate-50"
                  aria-label="Share"
                >
                  <Share2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-primary shadow-sm transition hover:bg-slate-50"
                  aria-label="Wishlist"
                >
                  <Heart className="h-4 w-4" />
                </button>
              </div>
            </div>

            <h1 className="text-2xl font-extrabold leading-tight text-[#1a2b4c] sm:text-3xl lg:text-4xl">
              {basic.name}
            </h1>

            <p className="mt-4 text-3xl font-extrabold text-primary lg:text-4xl">
              {formatPrice(pricing.price)}
              <span className="text-lg font-semibold text-slate-400 lg:text-xl"> / {pricing.unit}</span>
            </p>

            <div className="mt-5 grid grid-cols-2 gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:max-w-md">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="h-5 w-5 shrink-0 text-slate-400" />
                <div>
                  <p className="text-[11px] font-medium text-slate-400">Min. Order</p>
                  <p className="text-sm font-bold text-[#1a2b4c]">
                    {pricing.minimum_order_quantity} {pricing.unit}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="h-5 w-5 shrink-0 text-slate-400" />
                <div>
                  <p className="text-[11px] font-medium text-slate-400">Listed</p>
                  <p className="text-sm font-bold text-[#1a2b4c]">
                    {formatListedAgo(product.created_at).replace("Listed ", "")}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <StarRating rating={ratings.average} reviews={ratings.total_reviews} />
            </div>

            {keySpecs.length > 0 && (
              <div className="mt-8">
                <h2 className="mb-3 text-base font-bold text-[#1a2b4c] lg:text-lg">Key Specifications</h2>
                <div className="flex gap-3 overflow-x-auto pb-1 lg:grid lg:grid-cols-2 lg:gap-3 lg:overflow-visible lg:pb-0">
                  {keySpecs.map((spec) => {
                    const inner = (
                      <>
                        <span className="text-xs font-medium text-slate-400">{spec.label}: </span>
                        <span className="text-sm font-bold text-[#1a2b4c]">{spec.value}</span>
                      </>
                    );
                    return spec.href ? (
                      <Link
                        key={spec.label}
                        href={spec.href}
                        className="shrink-0 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm transition hover:border-primary/30 hover:bg-primary/5 lg:shrink"
                      >
                        {inner}
                      </Link>
                    ) : (
                      <div
                        key={spec.label}
                        className="shrink-0 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm lg:shrink"
                      >
                        {inner}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:mt-10">
              <Link
                href={contactHref}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-hover"
              >
                <MessageCircle className="h-4 w-4" />
                Send Inquiry
              </Link>
              {whatsapp && (
                <a
                  href={whatsAppHref(whatsapp, inquiryMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-6 py-3.5 text-sm font-bold text-[#1a2b4c] transition hover:border-primary/30 hover:bg-white"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
              )}
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-[#1a2b4c] transition hover:bg-slate-50"
                >
                  <Phone className="h-4 w-4" />
                  Call
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Details + seller sidebar */}
        <div className="mt-10 grid grid-cols-1 gap-8 lg:mt-14 lg:grid-cols-12 lg:gap-10">
          <div className="space-y-8 lg:col-span-8">
            {description && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
                <h2 className="text-lg font-bold text-[#1a2b4c]">About this Product</h2>
                <p className="mt-4 text-sm leading-relaxed text-slate-600 lg:text-base">
                  {displayDesc}
                  {!descExpanded && showReadMore && "…"}
                </p>
                {showReadMore && (
                  <button
                    type="button"
                    onClick={() => setDescExpanded((v) => !v)}
                    className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-primary"
                  >
                    {descExpanded ? "Show less" : "Read More"}
                    <ChevronDown
                      className={`h-4 w-4 transition ${descExpanded ? "rotate-180" : ""}`}
                    />
                  </button>
                )}
              </section>
            )}

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
              <h2 className="text-lg font-bold text-[#1a2b4c]">Product Specifications</h2>
              <dl className="mt-5 divide-y divide-slate-100">
                {fullSpecs.map((spec) => (
                  <div
                    key={spec.label}
                    className="grid grid-cols-2 gap-4 py-3.5 sm:grid-cols-[minmax(140px,35%)_1fr]"
                  >
                    <dt className="text-sm font-medium text-slate-400">{spec.label}</dt>
                    <dd className="text-sm font-semibold text-[#1a2b4c]">
                      {spec.href ? (
                        <Link href={spec.href} className="text-primary hover:underline">
                          {spec.value}
                        </Link>
                      ) : (
                        spec.value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>

          <div className="lg:col-span-4">
            <SellerProfileCard product={product} contactHref={contactHref} />
          </div>
        </div>

        <div className="mt-10 text-center lg:mt-12">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-hover"
          >
            <Package className="h-4 w-4" />
            Browse more products
          </Link>
        </div>
      </div>

      {/* Mobile wishlist bar */}
      <div className="sticky bottom-0 border-t border-slate-100 bg-white px-4 py-3 lg:hidden">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-primary"
        >
          <Heart className="h-5 w-5" />
          Wishlist
        </button>
      </div>
    </div>
  );
}
