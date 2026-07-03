"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { TrendingUp, MapPin, Star, ArrowRight, BadgeCheck, Package } from "lucide-react";
import type { ApiProductListItem } from "@/types/catalog";
import { formatLocation, formatPrice, getInitials, productGradient, resolveImageUrl } from "@/utils/catalogHelpers";

interface ProductCardProps {
  product: ApiProductListItem;
  delay?: number;
}

export default function ProductCard({ product, delay = 0 }: ProductCardProps) {
  const location = formatLocation(product.city, product.state);
  const gradient = productGradient(product.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay }}
      whileHover={{ y: -4 }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:border-primary/25 hover:shadow-lg hover:shadow-primary/5"
    >
      <Link href={`/products/${product.id}`} className="relative block aspect-[4/3] overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
        {product.thumbnail ? (
          <Image
            src={resolveImageUrl(product.thumbnail) || ""}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl font-black text-white/20">{getInitials(product.name)}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {product.is_trending && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#1a3a5c]/90 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-white shadow-sm backdrop-blur-[4px]">
              <TrendingUp className="h-3 w-3" />
              Hot
            </span>
          )}
          {product.verified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/90 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-white shadow-sm backdrop-blur-[4px]">
              <BadgeCheck className="h-3 w-3" />
              Verified
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <Link href={`/products/${product.id}`}>
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-snug text-slate-900 transition-colors duration-200 group-hover:text-primary">
            {product.name}
          </h3>
        </Link>

        <div className="mt-3 flex items-baseline justify-between gap-1">
          <div className="flex items-baseline gap-0.5">
            <p className="text-xl font-extrabold text-primary">
              {formatPrice(product.price, product.currency)}
            </p>
            <span className="text-[11px] font-medium text-slate-400">/ {product.unit}</span>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
            <Star className="h-3 w-3 fill-slate-400 text-slate-400" />
            <span>{product.rating.toFixed(1)}</span>
          </div>
        </div>

        <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
          <Package className="h-3.5 w-3.5 text-slate-300" />
          Min. Order: {product.moq} {product.unit}
        </p>

        <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <p className="truncate font-semibold text-slate-800">{product.supplier_name}</p>
          <p className="flex items-center gap-1 truncate text-slate-400">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-300" />
            {location}
          </p>
        </div>

        <Link
          href={`/products/${product.id}`}
          className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-50 py-2.5 text-xs font-semibold text-slate-700 transition duration-200 group-hover:bg-primary group-hover:text-white"
        >
          View Details
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </motion.div>
  );
}
