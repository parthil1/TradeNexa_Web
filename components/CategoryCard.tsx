"use client";

import React from "react";
import Link from "next/link";
import { Tag, Layers, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import CatalogImage from "@/components/catalog/CatalogImage";
import { getCategoryFallbackIcon } from "@/utils/categoryIcons";
import type { LucideIcon } from "lucide-react";

interface CategoryCardProps {
  icon?: LucideIcon;
  imageUrl?: string | null;
  slug?: string;
  title: string;
  description?: string;
  productCount?: number;
  subcategoryCount?: number;
  href?: string;
  delay?: number;
}

export default function CategoryCard({
  icon: Icon,
  imageUrl,
  slug,
  title,
  description,
  productCount = 0,
  subcategoryCount,
  href,
  delay = 0,
}: CategoryCardProps) {
  const statsLabel =
    productCount > 0
      ? `${productCount.toLocaleString()} products`
      : subcategoryCount !== undefined
        ? `${subcategoryCount} subcategories`
        : "Explore";

  const FallbackIcon = Icon ?? getCategoryFallbackIcon(slug, title);

  const inner = (
    <>
      <div className="relative h-28 overflow-hidden bg-gradient-to-br from-portal-buyer/10 via-portal-buyer/5 to-portal-bg">
        <CatalogImage
          src={imageUrl}
          alt={title}
          fallbackIcon={FallbackIcon}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white/60 to-transparent pointer-events-none" />
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-portal-muted shadow-sm backdrop-blur-sm">
          <Tag className="h-3 w-3 text-portal-buyer" />
          {statsLabel}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-bold text-portal-fg transition-colors group-hover:text-portal-buyer">
          {title}
        </h3>
        {description && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-portal-muted">{description}</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-4">
          <span className="text-xs font-semibold text-portal-buyer">View subcategories</span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-portal-buyer/10 text-portal-buyer transition group-hover:bg-portal-buyer group-hover:text-white">
            <ChevronRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </>
  );

  const className =
    "group flex h-full flex-col overflow-hidden rounded-xl border border-portal-border bg-white shadow-sm transition-all hover:border-portal-buyer/25 hover:shadow-[0_8px_24px_-8px_rgba(15,23,42,0.1)]";

  if (href) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35, delay }}
        whileHover={{ y: -4 }}
        className="h-full"
      >
        <Link href={href} className={className}>
          {inner}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay }}
      whileHover={{ y: -4 }}
      className={className}
    >
      {inner}
    </motion.div>
  );
}
