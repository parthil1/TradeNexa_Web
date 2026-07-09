"use client";

import React from "react";
import Link from "next/link";
import CatalogImage from "@/components/catalog/CatalogImage";
import { getCategoryFallbackIcon } from "@/utils/categoryIcons";

interface MarketplaceCategoryRowProps {
  slug: string;
  imageUrl?: string | null;
  title: string;
  productCount?: number;
  subcategoryCount?: number;
  href: string;
  index?: number;
}

export default function MarketplaceCategoryRow({
  slug,
  imageUrl,
  title,
  productCount = 0,
  href,
}: MarketplaceCategoryRowProps) {
  const FallbackIcon = getCategoryFallbackIcon(slug, title);

  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:cursor-pointer hover:border-slate-300 hover:shadow-sm"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-50">
        {imageUrl ? (
          <CatalogImage
            src={imageUrl}
            alt={title}
            fallbackIcon={FallbackIcon}
            fallbackClassName="bg-blue-50"
            className="h-full w-full object-cover"
          />
        ) : (
          <FallbackIcon className="h-5 w-5 text-blue-500" strokeWidth={1.75} />
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-900 group-hover:text-blue-600">
          {title}
        </p>
        <p className="text-xs text-slate-400">{productCount.toLocaleString()} products</p>
      </div>
    </Link>
  );
}
