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
      className="group flex items-center gap-3 rounded-2xl border border-[#E8ECF0] bg-white p-4 transition hover:border-[#1565C0]/30 hover:shadow-md"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#E8EFF9]">
        {imageUrl ? (
          <CatalogImage
            src={imageUrl}
            alt={title}
            fallbackIcon={FallbackIcon}
            fallbackClassName="bg-[#E8EFF9]"
            className="h-full w-full object-cover"
          />
        ) : (
          <FallbackIcon className="h-5 w-5 text-[#1565C0]" strokeWidth={1.75} />
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-extrabold text-[#0D1B2A] group-hover:text-[#1565C0]">
          {title}
        </p>
        <p className="text-xs text-[#546E7A]">{productCount.toLocaleString()} products</p>
      </div>
    </Link>
  );
}
