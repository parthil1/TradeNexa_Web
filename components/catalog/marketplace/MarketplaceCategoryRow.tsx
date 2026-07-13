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
      className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-shadow hover:cursor-pointer hover:border-muted-fg hover:shadow-sm"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10">
        {imageUrl ? (
          <CatalogImage
            src={imageUrl}
            alt={title}
            fallbackIcon={FallbackIcon}
            fallbackClassName="bg-primary/10"
            className="h-full w-full object-cover"
          />
        ) : (
          <FallbackIcon className="h-5 w-5 text-primary" strokeWidth={1.75} />
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground group-hover:text-primary">
          {title}
        </p>
        <p className="text-xs text-muted-fg">{productCount.toLocaleString()} products</p>
      </div>
    </Link>
  );
}
