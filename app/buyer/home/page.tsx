"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, ChevronRight, Search, Star } from "lucide-react";
import PortalSection from "@/components/portal/PortalSection";
import PortalProductCard from "@/components/portal/PortalProductCard";
import { useAuth } from "@/hooks/useAuth";
import { demoBanners, demoSuppliers } from "@/data/portalDemo";
import { fetchCategories, fetchProducts, fetchTrendingProducts } from "@/services/catalogService";
import type { ApiCategory, ApiProductListItem } from "@/types/catalog";
import { getCategoryFallbackIcon } from "@/utils/categoryIcons";

export default function BuyerHomePage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [trending, setTrending] = useState<ApiProductListItem[]>([]);
  const [recent, setRecent] = useState<ApiProductListItem[]>([]);
  const [bannerIndex, setBannerIndex] = useState(0);

  useEffect(() => {
    fetchCategories({ page: 1, limit: 8 }).then((r) => setCategories(r.results));
    fetchTrendingProducts(6).then(setTrending);
    fetchProducts({ page: 1, limit: 8, sort_by: "created_at", sort_order: "desc" }).then((r) =>
      setRecent(r.results)
    );
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setBannerIndex((i) => (i + 1) % demoBanners.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const banner = demoBanners[bannerIndex];

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <p className="text-sm text-[#546E7A]">Welcome back,</p>
        <h2 className="text-2xl font-extrabold text-[#0D1B2A] sm:text-3xl">
          {user?.name || user?.company || "Buyer"}
        </h2>
      </motion.div>

      <Link
        href="/buyer/search"
        className="mb-6 flex items-center gap-3 rounded-2xl border border-[#E0E6ED] bg-white px-4 py-3.5 shadow-sm transition hover:border-[#1565C0]/40"
      >
        <Search className="h-5 w-5 text-[#546E7A]" />
        <span className="text-sm text-[#B0BEC5]">Search products, suppliers, categories...</span>
      </Link>

      <motion.div
        key={banner.id}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`mb-8 overflow-hidden rounded-3xl bg-gradient-to-br ${banner.gradient} p-6 text-white shadow-lg sm:p-8`}
      >
        <p className="text-xs font-bold uppercase tracking-wider text-white/70">TradeNexa B2B</p>
        <h3 className="mt-2 text-2xl font-extrabold sm:text-3xl">{banner.title}</h3>
        <p className="mt-2 max-w-md text-sm text-white/80">{banner.subtitle}</p>
        <Link
          href={banner.href}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#1565C0] transition hover:bg-white/90"
        >
          {banner.cta}
          <ArrowRight className="h-4 w-4" />
        </Link>
        <div className="mt-4 flex gap-1.5">
          {demoBanners.map((b, i) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setBannerIndex(i)}
              className={`h-1.5 rounded-full transition-all ${i === bannerIndex ? "w-6 bg-white" : "w-1.5 bg-white/40"}`}
              aria-label={`Banner ${i + 1}`}
            />
          ))}
        </div>
      </motion.div>

      <PortalSection
        title="Top Categories"
        subtitle="Browse by industry"
        action={
          <Link href="/buyer/categories" className="text-sm font-bold text-[#1565C0]">
            View all
          </Link>
        }
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
          {categories.map((cat) => {
            const Icon = getCategoryFallbackIcon(cat.slug, cat.name);
            return (
              <Link
                key={cat.id}
                href={`/buyer/category/${cat.id}`}
                className="flex flex-col items-center rounded-2xl border border-[#E8ECF0] bg-white p-4 text-center transition hover:border-[#1565C0]/30 hover:shadow-md"
              >
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8EFF9]">
                  <Icon className="h-6 w-6 text-[#1565C0]" />
                </div>
                <p className="line-clamp-2 text-xs font-bold text-[#0D1B2A]">{cat.name}</p>
              </Link>
            );
          })}
        </div>
      </PortalSection>

      <PortalSection
        title="Featured Suppliers"
        subtitle="Verified & trusted businesses"
        action={
          <Link href="/buyer/search" className="text-sm font-bold text-[#1565C0]">
            View all
          </Link>
        }
      >
        <div className="flex gap-4 overflow-x-auto pb-2">
          {demoSuppliers.map((s) => (
            <Link
              key={s.id}
              href={`/buyer/supplier/${s.id}`}
              className="w-64 shrink-0 rounded-2xl border border-[#E8ECF0] bg-white p-4 transition hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8EFF9] text-sm font-extrabold text-[#1565C0]">
                  {s.name[0]}
                </div>
                {s.verified ? <BadgeCheck className="h-5 w-5 text-[#1565C0]" /> : null}
              </div>
              <p className="mt-3 line-clamp-2 text-sm font-extrabold text-[#0D1B2A]">{s.name}</p>
              <p className="mt-1 text-xs text-[#546E7A]">{s.category}</p>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 font-semibold text-amber-600">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {s.rating}
                </span>
                <span className="text-[#546E7A]">{s.productCount} products</span>
              </div>
            </Link>
          ))}
        </div>
      </PortalSection>

      <PortalSection
        title="Trending Products"
        subtitle="Most popular items this week"
        action={
          <Link href="/buyer/trending-products" className="text-sm font-bold text-[#1565C0]">
            View all
          </Link>
        }
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
          {trending.map((p) => (
            <PortalProductCard key={p.id} product={p} />
          ))}
        </div>
      </PortalSection>

      <PortalSection title="Recently Added" subtitle="Newest products on TradeNexa">
        <div className="flex gap-4 overflow-x-auto pb-2">
          {recent.map((p) => (
            <div key={p.id} className="w-44 shrink-0">
              <PortalProductCard product={p} />
            </div>
          ))}
        </div>
      </PortalSection>

      <Link
        href="/buyer/post-requirement"
        className="mb-4 flex items-center justify-between rounded-2xl border border-[#E0E6ED] bg-white p-4 transition hover:border-[#FF6D00]/40"
      >
        <div>
          <p className="text-sm font-extrabold text-[#0D1B2A]">Post a Requirement</p>
          <p className="text-xs text-[#546E7A]">Get quotes from multiple sellers</p>
        </div>
        <ChevronRight className="h-5 w-5 text-[#FF6D00]" />
      </Link>
    </div>
  );
}
