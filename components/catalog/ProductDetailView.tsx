"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import CatalogBreadcrumbs from "@/components/catalog/CatalogBreadcrumbs";
import type { ApiProductDetail } from "@/types/catalog";
import {
  formatLocation,
  formatPrice,
  formatRating,
  getInitials,
  productGradient,
  resolveImageUrl,
  whatsAppHref,
} from "@/utils/catalogHelpers";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Share2,
  Sparkles,
  Star,
  Tag,
  TrendingUp,
} from "lucide-react";
import { showErrorToast } from "@/utils/toast";

interface ProductDetailViewProps {
  product: ApiProductDetail;
}

function SpecTile({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 transition hover:border-primary/20 hover:bg-primary/5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-slate-800">{value}</p>
    </div>
  );
  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}

export default function ProductDetailView({ product }: ProductDetailViewProps) {
  const { basic_details: basic, pricing, seller, marketplace, ratings } = product;

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

  const [activeImage, setActiveImage] = useState<string | null>(
    gallery[0] ?? null
  );

  const location = formatLocation(
    seller.location.city,
    seller.location.state,
    seller.location.country
  );

  const breadcrumbItems = [
    { label: "Categories", href: "/categories" },
    ...(basic.category
      ? [{ label: basic.category.name, href: `/products?category_id=${basic.category.id}` }]
      : []),
    ...(basic.subcategory
      ? [{ label: basic.subcategory.name, href: `/products?subcategory_id=${basic.subcategory.id}` }]
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

  const badges = [
    marketplace.is_trending && { label: "Trending", icon: TrendingUp, className: "bg-rose-500/95 text-white backdrop-blur-[2px]" },
    marketplace.is_featured && { label: "Featured", icon: Sparkles, className: "bg-amber-500/95 text-white backdrop-blur-[2px]" },
    marketplace.is_recommended && { label: "Recommended", icon: BadgeCheck, className: "bg-blue-600/95 text-white backdrop-blur-[2px]" },
  ].filter(Boolean) as { label: string; icon: React.ComponentType<{ className?: string }>; className: string }[];

  return (
    <>
      <section className="border-b border-slate-100 bg-white py-8 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <CatalogBreadcrumbs items={breadcrumbItems} />

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14">
            {/* Gallery */}
            <div>
              <div
                className={`relative aspect-square overflow-hidden rounded-3xl border border-slate-100 bg-gradient-to-br shadow-sm ${productGradient(product.id)}`}
              >
                {activeImage ? (
                  <Image src={activeImage} alt={basic.name} fill className="object-cover" unoptimized />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
                    <span className="text-7xl font-black text-white/25">{getInitials(basic.name)}</span>
                    {basic.brand && (
                      <span className="rounded-full bg-white/20 px-4 py-1 text-sm font-bold text-white/90 backdrop-blur-sm">
                        {basic.brand.name}
                      </span>
                    )}
                  </div>
                )}

                {badges.length > 0 && (
                  <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                    {badges.map(({ label, icon: Icon, className }) => (
                      <span
                        key={label}
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold uppercase shadow-sm ${className}`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                      </span>
                    ))}
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
                      className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                        activeImage === url ? "border-primary ring-2 ring-primary/20" : "border-slate-200"
                      }`}
                    >
                      <Image src={url} alt="" fill className="object-cover" unoptimized />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product info */}
            <div className="flex flex-col">
              <div className="flex flex-wrap items-center gap-2">
                {basic.brand && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
                    <Tag className="h-3.5 w-3.5" />
                    {basic.brand.name}
                  </span>
                )}
                <span className="text-xs text-slate-400">SKU #{product.id}</span>
              </div>

              <h1 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                {basic.name}
              </h1>

              <div className="mt-4 flex flex-wrap items-end gap-x-4 gap-y-2">
                <p className="text-3xl font-extrabold text-primary sm:text-4xl">
                  {formatPrice(pricing.price)}
                  <span className="ml-1 text-base font-medium text-slate-400">/ {pricing.unit}</span>
                </p>
                <span className="rounded-full bg-slate-100 px-3.5 py-1.5 text-sm font-semibold text-slate-600">
                  MOQ: {pricing.minimum_order_quantity} {pricing.unit}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 font-semibold text-amber-800">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {formatRating(ratings.average)} rating
                </span>
                {ratings.total_reviews != null && ratings.total_reviews > 0 && (
                  <span className="text-slate-500">{ratings.total_reviews} reviews</span>
                )}
                {pricing.gst_percentage != null && (
                  <span className="text-slate-500">
                    GST {pricing.gst_percentage}%
                    {pricing.gst_included ? " (incl.)" : ""}
                  </span>
                )}
              </div>

              {(basic.short_description || basic.description) && (
                <p className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/55 p-4 text-sm leading-relaxed text-slate-600">
                  {basic.short_description || basic.description}
                </p>
              )}

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-2">
                {basic.category && (
                  <SpecTile
                    label="Category"
                    value={basic.category.name}
                    href={`/products?category_id=${basic.category.id}`}
                  />
                )}
                {basic.subcategory && (
                  <SpecTile
                    label="Subcategory"
                    value={basic.subcategory.name}
                    href={`/products?subcategory_id=${basic.subcategory.id}`}
                  />
                )}
                {pricing.hsn_code && <SpecTile label="HSN Code" value={pricing.hsn_code} />}
                {basic.country_of_origin && (
                  <SpecTile label="Origin" value={basic.country_of_origin} />
                )}
                {pricing.price_type && <SpecTile label="Price Type" value={pricing.price_type} />}
              </div>

              <div className="mt-8 space-y-3">
                <Link
                  href={contactHref}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/15 transition duration-200 hover:bg-primary-hover hover:shadow-primary/25"
                >
                  Send Inquiry
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <div className="grid grid-cols-3 gap-2">
                  {phone && (
                    <a
                      href={`tel:${phone}`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-3 text-xs font-semibold text-slate-700 transition duration-200 hover:bg-slate-50"
                    >
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span>Call Seller</span>
                    </a>
                  )}
                  {whatsapp && (
                    <a
                      href={whatsAppHref(whatsapp, inquiryMessage)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 py-3 text-xs font-semibold text-emerald-700 transition duration-200 hover:bg-emerald-100/70"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => void handleShare()}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-3 text-xs font-semibold text-slate-700 transition duration-200 hover:bg-slate-50"
                  >
                    <Share2 className="h-4 w-4 text-slate-400" />
                    <span>Share</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seller */}
      <section className="bg-slate-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-xl font-bold text-slate-900">Seller Information</h2>
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-gradient-to-r from-primary/5 to-transparent px-6 py-5 sm:px-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
                  {seller.company.logo ? (
                    <Image
                      src={resolveImageUrl(seller.company.logo) || ""}
                      alt={seller.company.name}
                      width={64}
                      height={64}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <Building2 className="h-8 w-8 text-primary" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{seller.company.name}</h3>
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Verified Seller
                    </span>
                  </div>
                  {seller.company.business_type && (
                    <p className="mt-1 text-sm text-slate-500">{seller.company.business_type}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      {formatRating(seller.rating.average)} seller rating
                    </span>
                    {seller.company.year_established && (
                      <span>Est. {seller.company.year_established}</span>
                    )}
                    {seller.company.experience_years > 0 && (
                      <span>{seller.company.experience_years}+ yrs experience</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
              <div className="flex items-start gap-3 text-sm text-slate-600">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <div>
                  <p className="font-semibold text-slate-800">Location</p>
                  <p className="mt-0.5">{seller.location.address || location}</p>
                  {seller.location.postal_code && (
                    <p className="text-slate-400">PIN {seller.location.postal_code}</p>
                  )}
                </div>
              </div>

              {seller.contact.email && (
                <div className="flex items-start gap-3 text-sm text-slate-600">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div>
                    <p className="font-semibold text-slate-800">Email</p>
                    <a href={`mailto:${seller.contact.email}`} className="mt-0.5 text-primary hover:underline">
                      {seller.contact.email}
                    </a>
                  </div>
                </div>
              )}

              {phone && (
                <div className="flex items-start gap-3 text-sm text-slate-600">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div>
                    <p className="font-semibold text-slate-800">Phone</p>
                    <a href={`tel:${phone}`} className="mt-0.5 text-primary hover:underline">
                      {phone}
                    </a>
                  </div>
                </div>
              )}

              {(seller.contact.website || seller.social_links.website) && (
                <div className="flex items-start gap-3 text-sm text-slate-600">
                  <Globe className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div>
                    <p className="font-semibold text-slate-800">Website</p>
                    <a
                      href={seller.contact.website || seller.social_links.website || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 break-all text-primary hover:underline"
                    >
                      {seller.contact.website || seller.social_links.website}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-hover"
          >
            <Package className="h-4 w-4" />
            Browse more products
          </Link>
        </div>
      </section>
    </>
  );
}
