"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  ClipboardList,
  FileText,
  Flame,
  LayoutGrid,
  MessageSquare,
  Search,
  Star,
} from "lucide-react";
import PortalSection from "@/components/portal/PortalSection";
import PortalProductCard from "@/components/portal/PortalProductCard";
import BuyerHomeBanner from "@/components/portal/BuyerHomeBanner";
import { useAuth } from "@/hooks/useAuth";
import { demoSuppliers } from "@/data/portalDemo";
import { fetchActiveBanners } from "@/services/bannerService";
import { fetchCategories, fetchProducts, fetchTrendingProductItems } from "@/services/catalogService";
import type { ApiBanner } from "@/types/banner";
import type { ApiCategory, ApiProductListItem } from "@/types/catalog";
import { getCategoryFallbackIcon } from "@/utils/categoryIcons";

const quickLinks = [
  {
    label: "Categories",
    href: "/buyer/categories",
    icon: LayoutGrid,
    bg: "bg-primary-soft",
    color: "text-primary",
  },
  {
    label: "Trending",
    href: "/buyer/trending-products",
    icon: Flame,
    bg: "bg-portal-seller-light",
    color: "text-accent",
  },
  {
    label: "RFQs",
    href: "/buyer/inquiries",
    icon: ClipboardList,
    bg: "bg-warning-soft",
    color: "text-warning",
  },
  {
    label: "Inquiries",
    href: "/buyer/product-inquiries",
    icon: MessageSquare,
    bg: "bg-muted",
    color: "text-foreground",
  },
  {
    label: "Post RFQ",
    href: "/buyer/post-requirement",
    icon: FileText,
    bg: "bg-success-soft",
    color: "text-success",
  },
];

function SectionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm font-semibold text-primary transition-colors duration-200 hover:text-primary-hover"
    >
      {children}
    </Link>
  );
}

export default function BuyerHomePage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [trending, setTrending] = useState<ApiProductListItem[]>([]);
  const [recent, setRecent] = useState<ApiProductListItem[]>([]);
  const [banners, setBanners] = useState<ApiBanner[]>([]);
  const [bannersLoading, setBannersLoading] = useState(true);

  const displayName = user?.name || user?.company || "Buyer";
  const initial = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    fetchCategories({ page: 1, limit: 8 }).then((r) => setCategories(r.results));
    fetchTrendingProductItems(6).then(setTrending);
    fetchProducts({ page: 1, limit: 8, sort_by: "created_at", sort_order: "desc" }).then((r) =>
      setRecent(r.results)
    );
    fetchActiveBanners(10)
      .then(setBanners)
      .catch(() => setBanners([]))
      .finally(() => setBannersLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-5 flex items-center gap-3 sm:mb-6"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-lg font-semibold text-white shadow-[var(--shadow-button)] sm:h-14 sm:w-14 sm:text-xl">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-fg sm:text-sm">Welcome back,</p>
          <h2 className="truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {displayName}
          </h2>
        </div>
      </motion.div>

      <Link
        href="/buyer/search"
        className="mb-5 flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 transition-all duration-200 hover:border-primary/40 sm:mb-6 sm:py-4"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft">
          <Search className="h-5 w-5 text-primary" aria-hidden />
        </div>
        <span className="text-sm text-muted-fg sm:text-base">
          Search products, suppliers, categories...
        </span>
      </Link>

      <div className="-mx-4 mb-5 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-5 sm:overflow-visible sm:px-0 sm:pb-0 md:mb-6">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="surface-card-hover flex min-w-[88px] shrink-0 snap-start flex-col items-center gap-2 p-3 sm:min-w-0 sm:p-4"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${link.bg}`}>
                <Icon className={`h-5 w-5 ${link.color}`} aria-hidden />
              </div>
              <span className="text-center text-[11px] font-semibold text-muted-fg sm:text-xs">
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>

      {bannersLoading ? (
        <div className="skeleton mb-5 h-[148px] sm:mb-6 sm:h-[168px] md:h-[188px]" />
      ) : banners.length > 0 ? (
        <BuyerHomeBanner banners={banners} />
      ) : (
        <Link
          href="/buyer/post-requirement"
          className="mb-5 block overflow-hidden rounded-xl bg-accent p-4 text-white transition-opacity duration-200 hover:opacity-95 sm:mb-6 sm:p-5"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/75">
            TradeNexa B2B
          </p>
          <h3 className="mt-0.5 text-base font-semibold sm:text-lg">Post Your Requirement</h3>
          <p className="mt-1 max-w-md text-xs text-white/85 sm:text-sm">
            Get quotes from multiple sellers in 24 hours
          </p>
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-card px-3 py-1.5 text-xs font-semibold text-accent sm:text-sm">
            Post RFQ
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </span>
        </Link>
      )}

      <PortalSection
        title="Top Categories"
        subtitle="Browse by industry"
        action={<SectionLink href="/buyer/categories">View all</SectionLink>}
      >
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 snap-x snap-mandatory md:mx-0 md:grid md:grid-cols-4 md:gap-3 md:overflow-visible md:px-0 md:pb-0">
          {categories.map((cat) => {
            const Icon = getCategoryFallbackIcon(cat.slug, cat.name);
            return (
              <Link
                key={cat.id}
                href={`/buyer/category/${cat.id}`}
                className="surface-card-hover flex min-w-[120px] shrink-0 snap-start flex-col items-center p-3.5 text-center sm:min-w-[140px] sm:p-4 md:min-w-0"
              >
                <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft sm:h-12 sm:w-12">
                  <Icon className="h-5 w-5 text-primary sm:h-6 sm:w-6" aria-hidden />
                </div>
                <p className="line-clamp-2 text-xs font-medium text-foreground sm:text-sm">
                  {cat.name}
                </p>
              </Link>
            );
          })}
        </div>
      </PortalSection>

      <PortalSection
        title="Featured Suppliers"
        subtitle="Verified & trusted businesses"
        action={<SectionLink href="/buyer/search">View all</SectionLink>}
      >
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 snap-x snap-mandatory md:mx-0 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-3">
          {demoSuppliers.map((s) => (
            <Link
              key={s.id}
              href={`/buyer/supplier/${s.id}`}
              className="surface-card-hover w-[78vw] max-w-[300px] shrink-0 snap-start p-4 sm:w-[300px] md:w-auto md:max-w-none"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-sm font-semibold text-primary">
                  {s.name[0]}
                </div>
                {s.verified ? <BadgeCheck className="h-5 w-5 text-primary" aria-hidden /> : null}
              </div>
              <p className="mt-3 line-clamp-2 text-sm font-semibold text-foreground">{s.name}</p>
              <p className="mt-1 text-xs text-muted-fg">{s.category}</p>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 font-semibold text-warning">
                  <Star className="h-3.5 w-3.5 fill-warning text-warning" aria-hidden />
                  {s.rating}
                </span>
                <span className="text-muted-fg">{s.productCount} products</span>
              </div>
            </Link>
          ))}
        </div>
      </PortalSection>

      <PortalSection
        title="Trending"
        subtitle="Most popular items this week"
        action={<SectionLink href="/buyer/trending-products">View all</SectionLink>}
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
        className="mb-2 flex items-center justify-between gap-4 overflow-hidden rounded-xl bg-accent p-4 text-white transition-opacity duration-200 hover:opacity-95 sm:mb-4 sm:p-5"
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold sm:text-base">Post a Requirement</p>
          <p className="mt-0.5 text-xs text-white/85 sm:text-sm">Get quotes from multiple sellers</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
          <ChevronRight className="h-5 w-5" aria-hidden />
        </div>
      </Link>
    </div>
  );
}
