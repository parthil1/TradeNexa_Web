"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FolderTree, Package, ChevronRight } from "lucide-react";
import CatalogImage from "@/components/catalog/CatalogImage";
import type { ApiSubcategory } from "@/types/catalog";

interface SubcategoryCardProps {
  subcategory: ApiSubcategory;
  delay?: number;
}

export default function SubcategoryCard({
  subcategory,
  delay = 0,
}: SubcategoryCardProps) {
  const href = `/products?subcategory_id=${subcategory.id}`;
  const count = subcategory.product_count ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      whileHover={{ y: -3 }}
    >
      <Link
        href={href}
        className="group flex items-center gap-4 rounded-xl border border-portal-border bg-white p-4 shadow-sm transition-all hover:border-portal-buyer/25 hover:shadow-[0_8px_24px_-8px_rgba(15,23,42,0.08)] sm:p-5"
      >
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-portal-buyer/10 to-portal-buyer/5 ring-1 ring-portal-buyer/10 transition group-hover:ring-portal-buyer/30">
          <CatalogImage
            src={subcategory.icon || subcategory.image}
            alt={subcategory.name}
            fallbackIcon={FolderTree}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold text-portal-fg transition-colors group-hover:text-portal-buyer">
            {subcategory.name}
          </h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-portal-muted">
            <Package className="h-3.5 w-3.5" />
            {count > 0 ? `${count.toLocaleString()} products` : "Browse listings"}
          </p>
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-portal-bg text-portal-muted transition group-hover:bg-portal-buyer group-hover:text-white">
          <ChevronRight className="h-5 w-5" />
        </div>
      </Link>
    </motion.div>
  );
}
