"use client";

import React from "react";
import { motion } from "framer-motion";
import type { ApiProductListItem } from "@/types/catalog";
import PortalProductCard from "@/components/portal/PortalProductCard";

interface ProductCardProps {
  product: ApiProductListItem;
  delay?: number;
  href?: string;
}

export default function ProductCard({ product, delay = 0, href }: ProductCardProps) {
  const card = (
    <PortalProductCard
      product={product}
      href={href ?? `/products/${product.id}`}
    />
  );

  if (delay <= 0) return card;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay }}
      className="h-full"
    >
      {card}
    </motion.div>
  );
}
