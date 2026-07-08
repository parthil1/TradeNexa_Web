"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { MapPin, Star } from "lucide-react";
import type { ApiProductListItem } from "@/types/catalog";
import { formatLocation, formatPrice, getInitials, productGradient, resolveImageUrl } from "@/utils/catalogHelpers";
import PortalWishlistButton from "@/components/portal/PortalWishlistButton";
import { useWishlist } from "@/hooks/useWishlist";

interface PortalProductCardProps {
  product: ApiProductListItem;
  href?: string;
  subcategoryLabel?: string;
  showWishlist?: boolean;
  onWishlistToggle?: (product: ApiProductListItem) => void;
}

export default function PortalProductCard({
  product,
  href,
  subcategoryLabel,
  showWishlist = true,
  onWishlistToggle,
}: PortalProductCardProps) {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const link = href ?? `/buyer/product/${product.id}`;
  const gradient = productGradient(product.id);
  const badgeLabel = subcategoryLabel || product.subcategory_name;
  const wishlisted = isWishlisted(product.id);

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }} className="h-full">
      <Link
        href={link}
        className="group flex h-full flex-col overflow-hidden rounded-xl border border-portal-border bg-white shadow-sm transition-all duration-200 hover:border-portal-buyer/25 hover:shadow-[0_8px_24px_-8px_rgba(37,99,235,0.12)]"
      >
        <div className="relative aspect-[4/3] overflow-hidden">
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
              <span className="text-4xl font-black text-white/25">{getInitials(product.name)}</span>
            </div>
          )}
          {badgeLabel ? (
            <span className="absolute left-2 top-2 max-w-[85%] truncate rounded-md bg-portal-buyer/90 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
              {badgeLabel}
            </span>
          ) : null}
          {showWishlist ? (
            <div className="absolute right-2 top-2">
              <PortalWishlistButton
                isWishlisted={wishlisted}
                onToggle={() =>
                  onWishlistToggle
                    ? onWishlistToggle(product)
                    : toggleWishlist(product.id)
                }
              />
            </div>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col p-4">
          <h4 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-portal-fg transition-colors group-hover:text-portal-buyer">
            {product.name}
          </h4>
          <p className="mt-2 text-lg font-bold text-portal-buyer">
            {formatPrice(product.price, product.currency)}
            <span className="text-[10px] font-medium text-portal-muted"> / {product.unit}</span>
          </p>
          <div className="mt-auto space-y-1 pt-3 text-[11px] text-portal-muted">
            <p className="truncate font-medium text-portal-fg">{product.supplier_name}</p>
            <p className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {formatLocation(product.city, product.state)}
            </p>
            <p className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {(product.rating ?? 0).toFixed(1)}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
