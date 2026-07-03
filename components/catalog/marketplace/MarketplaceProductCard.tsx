"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, BadgeCheck, Package, MapPin } from "lucide-react";
import type { ApiProductListItem } from "@/types/catalog";
import { formatPrice, formatLocation, getInitials, resolveImageUrl } from "@/utils/catalogHelpers";
import { getMarketplaceTheme } from "@/utils/marketplaceTheme";

interface MarketplaceProductCardProps {
  product: ApiProductListItem;
  subcategoryLabel?: string;
  themeSeed?: number | string;
}

export default function MarketplaceProductCard({
  product,
  subcategoryLabel,
  themeSeed,
}: MarketplaceProductCardProps) {
  const theme = getMarketplaceTheme(themeSeed ?? product.id);
  const resolvedThumb = resolveImageUrl(product.thumbnail);
  const location = formatLocation(product.city, product.state);

  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-lg"
    >
      <div className={`relative aspect-[4/3] lg:aspect-[5/4] ${theme.pastel}`}>
        {subcategoryLabel && (
          <span
            className={`absolute left-3 top-3 z-10 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${theme.productBadge} ${theme.productBadgeText}`}
          >
            {subcategoryLabel}
          </span>
        )}

        <button
          type="button"
          onClick={(e) => e.preventDefault()}
          aria-label="Save product"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-400 shadow-sm backdrop-blur-sm transition hover:text-red-400 lg:h-9 lg:w-9"
        >
          <Heart className="h-4 w-4" />
        </button>

        {resolvedThumb ? (
          <Image
            src={resolvedThumb}
            alt={product.name}
            fill
            className="object-contain p-5 transition-transform duration-500 group-hover:scale-105 lg:p-8"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            <Package className={`mb-2 h-14 w-14 ${theme.iconText} opacity-40`} strokeWidth={1.25} />
            <span
              className={`text-center text-[10px] font-semibold uppercase tracking-wider ${theme.iconText} opacity-50`}
            >
              {getInitials(product.name)}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4 lg:p-5">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-snug text-[#1a2b4c] group-hover:text-primary lg:min-h-[2.75rem] lg:text-base">
          {product.name}
        </h3>

        <p className="mt-2.5 text-lg font-extrabold text-primary lg:text-xl">
          {formatPrice(product.price, product.currency)}
          <span className="text-xs font-semibold text-slate-400 lg:text-sm"> / {product.unit}</span>
        </p>

        <p className="mt-1 text-xs font-medium text-slate-400">
          Min. Order: {product.moq} {product.unit}
        </p>

        {product.verified && (
          <p className="mt-3 flex items-center gap-1.5 truncate text-xs font-medium text-slate-500">
            <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">{product.supplier_name}</span>
          </p>
        )}

        <p className="mt-1.5 hidden items-center gap-1 truncate text-xs text-slate-400 lg:flex">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {location}
        </p>
      </div>
    </Link>
  );
}
