"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  FileText,
  Flame,
  LayoutGrid,
  MessageSquare,
  Search,
  Star,
  TrendingUp,
} from "lucide-react";
import PortalSection from "@/components/portal/PortalSection";
import PortalProductCard from "@/components/portal/PortalProductCard";
import { useAuth } from "@/hooks/useAuth";
import { demoBanners, demoSuppliers } from "@/data/portalDemo";
import { fetchCategories, fetchProducts, fetchTrendingProductItems } from "@/services/catalogService";
import type { ApiCategory, ApiProductListItem } from "@/types/catalog";
import { getCategoryFallbackIcon } from "@/utils/categoryIcons";

const quickLinks = [
  { label: "Categories", href: "/buyer/categories", icon: LayoutGrid, bg: "bg-[#E8EFF9]", color: "text-[#1565C0]" },
  { label: "Trending", href: "/buyer/trending-products", icon: Flame, bg: "bg-orange-50", color: "text-[#FF6D00]" },
  { label: "Inquiries", href: "/buyer/inquiries", icon: MessageSquare, bg: "bg-violet-50", color: "text-[#8B5CF6]" },
  { label: "Post RFQ", href: "/buyer/post-requirement", icon: FileText, bg: "bg-emerald-50", color: "text-[#2E7D32]" },
];

export default function BuyerHomePage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [trending, setTrending] = useState<ApiProductListItem[]>([]);
  const [recent, setRecent] = useState<ApiProductListItem[]>([]);
  const [bannerIndex, setBannerIndex] = useState(0);

  const displayName = user?.name || user?.company || "Buyer";
  const initial = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    fetchCategories({ page: 1, limit: 8 }).then((r) => setCategories(r.results));
    fetchTrendingProductItems(6).then(setTrending);
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
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-5 md:px-8 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5 flex items-center gap-3 sm:mb-6"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1565C0] to-[#5E92F3] text-lg font-extrabold text-white shadow-md shadow-[#1565C0]/25 sm:h-14 sm:w-14 sm:text-xl">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-[#546E7A] sm:text-sm">Welcome back,</p>
          <h2 className="truncate text-xl font-extrabold text-[#0D1B2A] sm:text-2xl md:text-3xl">
            {displayName}
          </h2>
        </div>
      </motion.div>

      <Link
        href="/buyer/search"
        className="mb-5 flex items-center gap-3 rounded-2xl border border-[#E0E6ED] bg-white px-4 py-3.5 shadow-sm transition active:scale-[0.99] hover:border-[#1565C0]/40 sm:mb-6 sm:py-4"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8EFF9]">
          <Search className="h-5 w-5 text-[#1565C0]" />
        </div>
        <span className="text-sm text-[#B0BEC5] sm:text-base">Search products, suppliers, categories...</span>
      </Link>

      <div className="-mx-4 mb-5 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 sm:pb-0 md:mb-6">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex min-w-[88px] shrink-0 snap-start flex-col items-center gap-2 rounded-2xl border border-[#E8ECF0] bg-white p-3 shadow-sm transition active:scale-[0.98] hover:border-[#1565C0]/25 sm:min-w-0 sm:p-4"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${link.bg}`}>
                <Icon className={`h-5 w-5 ${link.color}`} />
              </div>
              <span className="text-center text-[11px] font-bold text-[#546E7A] sm:text-xs">{link.label}</span>
            </Link>
          );
        })}
      </div>

      <motion.div
        key={banner.id}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`mb-6 overflow-hidden rounded-2xl bg-gradient-to-br sm:mb-8 sm:rounded-3xl ${banner.gradient} p-5 text-white shadow-lg sm:p-8`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/70 sm:text-xs">TradeNexa B2B</p>
            <h3 className="mt-1.5 text-xl font-extrabold leading-tight sm:mt-2 sm:text-2xl md:text-3xl">
              {banner.title}
            </h3>
            <p className="mt-2 max-w-md text-xs text-white/80 sm:text-sm">{banner.subtitle}</p>
          </div>
          <TrendingUp className="hidden h-8 w-8 shrink-0 text-white/30 sm:block" />
        </div>
        <Link
          href={banner.href}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#1565C0] transition hover:bg-white/90 sm:mt-5"
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
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 snap-x snap-mandatory md:mx-0 md:grid md:grid-cols-4 md:gap-3 md:overflow-visible md:px-0 md:pb-0">
          {categories.map((cat) => {
            const Icon = getCategoryFallbackIcon(cat.slug, cat.name);
            return (
              <Link
                key={cat.id}
                href={`/buyer/category/${cat.id}`}
                className="flex min-w-[120px] shrink-0 snap-start flex-col items-center rounded-2xl border border-[#E8ECF0] bg-white p-3.5 text-center shadow-sm transition active:scale-[0.98] hover:border-[#1565C0]/30 hover:shadow-md sm:min-w-[140px] sm:p-4 md:min-w-0"
              >
                <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8EFF9] sm:h-12 sm:w-12">
                  <Icon className="h-5 w-5 text-[#1565C0] sm:h-6 sm:w-6" />
                </div>
                <p className="line-clamp-2 text-[11px] font-bold text-[#0D1B2A] sm:text-xs">{cat.name}</p>
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
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 snap-x snap-mandatory md:mx-0 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-3">
          {demoSuppliers.map((s) => (
            <Link
              key={s.id}
              href={`/buyer/supplier/${s.id}`}
              className="w-[78vw] max-w-[300px] shrink-0 snap-start rounded-2xl border border-[#E8ECF0] bg-white p-4 shadow-sm transition active:scale-[0.99] hover:shadow-md sm:w-[300px] md:w-auto md:max-w-none"
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
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 md:gap-4">
          {trending.map((p) => (
            <PortalProductCard key={p.id} product={p} />
          ))}
        </div>
      </PortalSection>

      <PortalSection title="Recently Added" subtitle="Newest products on TradeNexa">
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 snap-x snap-mandatory sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-3 sm:overflow-visible sm:px-0 sm:pb-0 md:grid-cols-3 lg:grid-cols-4">
          {recent.map((p) => (
            <div key={p.id} className="w-[44vw] min-w-[150px] shrink-0 snap-start sm:w-auto sm:min-w-0">
              <PortalProductCard product={p} />
            </div>
          ))}
        </div>
      </PortalSection>

      <Link
        href="/buyer/post-requirement"
        className="mb-2 flex items-center justify-between gap-4 overflow-hidden rounded-2xl bg-gradient-to-r from-[#E65100] to-[#FF6D00] p-4 text-white shadow-lg shadow-[#FF6D00]/20 transition active:scale-[0.99] sm:mb-4 sm:rounded-3xl sm:p-5"
      >
        <div className="min-w-0">
          <p className="text-sm font-extrabold sm:text-base">Post a Requirement</p>
          <p className="mt-0.5 text-xs text-white/85 sm:text-sm">Get quotes from multiple sellers</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
          <ChevronRight className="h-5 w-5" />
        </div>
      </Link>
    </div>
  );
}
