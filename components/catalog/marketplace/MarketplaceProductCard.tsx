"use client";

import React from "react";
import type { ApiProductListItem } from "@/types/catalog";
import PortalProductCard from "@/components/portal/PortalProductCard";

interface MarketplaceProductCardProps {
  product: ApiProductListItem;
  subcategoryLabel?: string;
  /** @deprecated themeSeed is ignored; kept for backward compatibility */
  themeSeed?: number | string;
}

export default function MarketplaceProductCard({
  product,
  subcategoryLabel,
}: MarketplaceProductCardProps) {
  return (
    <PortalProductCard
      product={product}
      href={`/products/${product.id}`}
      subcategoryLabel={subcategoryLabel}
    />
  );
}
