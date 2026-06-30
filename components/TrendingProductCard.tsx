"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { TrendingUp, MapPin, Star, ArrowRight } from "lucide-react";

export interface TrendingProduct {
  id: string;
  name: string;
  category: string;
  priceRange: string;
  unit: string;
  seller: string;
  location: string;
  rating: number;
  inquiries: number;
  trend: string;
  imageColor: string;
}

interface TrendingProductCardProps {
  product: TrendingProduct;
  delay?: number;
}

export default function TrendingProductCard({ product, delay = 0 }: TrendingProductCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4 }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
    >
      <div className={`relative flex h-36 items-center justify-center ${product.imageColor}`}>
        <span className="text-4xl font-black text-white/20">{product.name.charAt(0)}</span>
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 shadow-sm">
          <TrendingUp className="h-3 w-3" />
          {product.trend}
        </span>
        <span className="absolute bottom-3 left-3 rounded-md bg-slate-900/70 px-2 py-0.5 text-[10px] font-medium text-white">
          {product.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="mb-1 line-clamp-2 text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <p className="mb-3 text-lg font-extrabold text-primary">
          {product.priceRange}
          <span className="ml-1 text-xs font-normal text-slate-400">/ {product.unit}</span>
        </p>

        <div className="mb-4 space-y-1.5 text-xs text-slate-500">
          <p className="font-medium text-slate-700">{product.seller}</p>
          <p className="flex items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0" />
            {product.location}
          </p>
          <div className="flex items-center justify-between pt-1">
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {product.rating.toFixed(1)}
            </span>
            <span className="text-slate-400">{product.inquiries} inquiries this week</span>
          </div>
        </div>

        <Link
          href="/contact"
          className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 py-2.5 text-xs font-semibold text-primary transition group-hover:bg-primary group-hover:text-white"
        >
          Send Inquiry
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </motion.div>
  );
}
