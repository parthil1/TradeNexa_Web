"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Clock3,
  Loader2,
  MapPin,
  Package,
  Star,
  TrendingUp,
} from "lucide-react";
import PortalBackLink from "@/components/portal/PortalBackLink";
import PortalEmptyState from "@/components/portal/PortalEmptyState";
import PortalInfiniteScroll from "@/components/portal/PortalInfiniteScroll";
import PortalProductCard from "@/components/portal/PortalProductCard";
import PortalSearchBar from "@/components/portal/PortalSearchBar";
import { Button } from "@/components/common/Button";
import { fetchSellerProducts } from "@/services/catalogService";
import { fetchSupplierById } from "@/services/supplierService";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useLoadMoreList } from "@/hooks/useLoadMoreList";
import { getInitials, resolveImageUrl } from "@/utils/catalogHelpers";
import { showErrorToast } from "@/utils/toast";
import type { ApiSupplier } from "@/types/supplier";

function StatStripItem({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  helper?: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 px-4 py-4 sm:px-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-lg font-semibold tracking-tight text-foreground">{value}</p>
        <p className="mt-0.5 text-xs font-medium text-muted-fg">{label}</p>
        {helper ? <div className="mt-1 text-xs text-muted-fg">{helper}</div> : null}
      </div>
    </div>
  );
}

export default function BuyerSupplierPage() {
  const params = useParams();
  const router = useRouter();
  const supplierId = Number(params.id);
  const validSupplierId = Number.isFinite(supplierId) && supplierId > 0;

  const [supplier, setSupplier] = useState<ApiSupplier | null>(null);
  const [supplierLoading, setSupplierLoading] = useState(true);
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 400);

  useEffect(() => {
    if (!validSupplierId) {
      return;
    }

    let cancelled = false;

    async function load() {
      setSupplierLoading(true);
      setSupplier(null);
      try {
        const data = await fetchSupplierById(supplierId);
        if (!cancelled) setSupplier(data);
      } catch (err) {
        if (cancelled) return;
        setSupplier(null);
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: unknown }).message ?? "")
            : "";
        showErrorToast(message.trim() || "Could not load seller profile");
      } finally {
        if (!cancelled) setSupplierLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [supplierId, validSupplierId]);

  const fetchPage = useCallback(
    (page: number) => {
      if (!validSupplierId) {
        return Promise.resolve({
          results: [],
          pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
        });
      }
      return fetchSellerProducts(supplierId, {
        page,
        limit: 10,
        search: debounced || undefined,
        sort_by: "id",
        sort_order: "asc",
      });
    },
    [debounced, supplierId, validSupplierId]
  );

  const {
    items: products,
    pagination,
    loading: productsLoading,
    loadingMore,
    error: productsError,
    hasMore,
    loadMore,
  } = useLoadMoreList({
    fetchPage,
    resetDeps: [debounced, supplierId],
    enabled: validSupplierId,
  });

  if (!validSupplierId) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <PortalBackLink href="/buyer/suppliers" label="Back to suppliers" />
        <p className="mt-6 text-sm text-muted-fg">Invalid seller.</p>
      </div>
    );
  }

  if (supplierLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 lg:px-8">
        <PortalBackLink href="/buyer/suppliers" label="Back to suppliers" />
        <p className="mt-6 text-sm text-muted-fg">Seller profile not found.</p>
        <Button
          type="button"
          variant="secondary"
          className="mt-4"
          onClick={() => router.back()}
        >
          Go back
        </Button>
      </div>
    );
  }

  const logoUrl = resolveImageUrl(supplier.logo);
  const showLogo = Boolean(logoUrl) && failedLogoUrl !== logoUrl;
  const city = supplier.city?.trim() || "—";
  const state = supplier.state?.trim() || "—";
  const locationParts = [supplier.city?.trim(), supplier.state?.trim()].filter(Boolean);
  const locationLabel = locationParts.length ? locationParts.join(" · ") : "Location not specified";
  const rating = supplier.rating ?? 0;
  const responseRate = supplier.response_rate ?? 0;
  const years = supplier.years_in_business ?? 0;
  const isInactive = supplier.is_active === false;
  const industry = supplier.industry?.trim();
  const productCount = supplier.product_count ?? (productsLoading ? null : pagination.total);
  const productCountLabel = productCount === null ? "..." : productCount.toLocaleString();

  const stats = [
    {
      icon: Star,
      label: "Rating",
      value: (
        <span className="inline-flex items-center gap-1.5">
          <span className="tabular-nums">{rating.toFixed(1)}</span>
          <Star className="h-3.5 w-3.5 fill-warning text-warning" aria-hidden />
        </span>
      ),
    },
    {
      icon: Clock3,
      label: "Years in business",
      value: <span className="tabular-nums">{years}</span>,
    },
    {
      icon: TrendingUp,
      label: "Response rate",
      value: (
        <span className="inline-flex items-center gap-2.5">
          <span className="tabular-nums">{responseRate}%</span>
          <span className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-muted sm:block">
            <span
              className="block h-full rounded-full bg-primary"
              style={{ width: `${Math.min(100, Math.max(0, responseRate))}%` }}
            />
          </span>
        </span>
      ),
    },
    {
      icon: Package,
      label: "Products",
      value: <span className="tabular-nums">{productCountLabel}</span>,
      helper:
        supplier.product_count == null && productsLoading ? "Loading catalog count" : undefined,
    },
  ];

  const productsLabel = productsLoading
    ? "Loading products..."
    : `${pagination.total.toLocaleString()} product${pagination.total === 1 ? "" : "s"}`;

  return (
    <div className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-4 h-64 bg-[radial-gradient(ellipse_at_top_left,_var(--primary-soft)_0%,_transparent_58%),linear-gradient(180deg,_var(--card)_0%,_transparent_70%)] opacity-80"
      />

      <div className="relative">
        <PortalBackLink href="/buyer/suppliers" label="Back to suppliers" />

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mt-4"
        >
          <div className="surface-card overflow-hidden rounded-2xl">
            <div className="relative overflow-hidden border-b border-border/70 bg-gradient-to-br from-primary-soft/80 via-card to-card px-5 py-6 sm:px-7 sm:py-7">
              <div
                aria-hidden
                className="absolute right-0 top-0 h-36 w-36 rounded-bl-[5rem] bg-primary-soft/70"
              />
              <div
                aria-hidden
                className="absolute bottom-0 right-10 h-24 w-52 bg-[radial-gradient(ellipse_at_center,_var(--primary-soft)_0%,_transparent_70%)] opacity-70"
              />

              <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-start gap-4 sm:gap-5">
                  <motion.span
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35, delay: 0.08, ease: "easeOut" }}
                    className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-primary/10 bg-card text-2xl font-bold text-primary sm:h-28 sm:w-28 sm:text-4xl"
                  >
                    {showLogo ? (
                      <Image
                        src={logoUrl as string}
                        alt={supplier.company_name}
                        width={112}
                        height={112}
                        className="h-full w-full object-cover"
                        unoptimized
                        onError={() => setFailedLogoUrl(logoUrl as string)}
                      />
                    ) : (
                      getInitials(supplier.company_name)
                    )}
                  </motion.span>

                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.36, delay: 0.14, ease: "easeOut" }}
                    className="min-w-0 flex-1 pt-1"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                      Supplier profile
                    </p>
                    <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                      {supplier.company_name}
                    </h1>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-fg">
                      {industry ? (
                        <span className="font-medium text-foreground">{industry}</span>
                      ) : null}
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-primary" aria-hidden />
                        {locationLabel}
                      </span>
                      {supplier.verified ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold text-white">
                          <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                          Verified
                        </span>
                      ) : null}
                    </div>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.36, delay: 0.2, ease: "easeOut" }}
                  className="grid grid-cols-2 gap-3 rounded-2xl border border-border/70 bg-card/80 p-3 text-sm md:w-64"
                >
                  <div>
                    <p className="text-xs font-medium text-muted-fg">City</p>
                    <p className="mt-1 font-semibold text-foreground">{city}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-fg">State</p>
                    <p className="mt-1 font-semibold text-foreground">{state}</p>
                  </div>
                </motion.div>
              </div>

              {isInactive ? (
                <div className="relative mt-5 flex items-start gap-2.5 rounded-xl border border-warning/25 bg-warning-soft px-4 py-3">
                  <AlertTriangle
                    className="mt-0.5 h-4 w-4 shrink-0 text-warning"
                    aria-hidden
                  />
                  <p className="text-xs font-medium leading-relaxed text-warning">
                    This seller is currently inactive and may not respond to new inquiries.
                  </p>
                </div>
              ) : null}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.34, delay: 0.24, ease: "easeOut" }}
              className="grid divide-y divide-border/80 bg-card sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4"
            >
              {stats.map((stat) => (
                <StatStripItem
                  key={stat.label}
                  icon={stat.icon}
                  label={stat.label}
                  value={stat.value}
                  helper={stat.helper}
                />
              ))}
            </motion.div>
          </div>
        </motion.div>

        <section className="mt-8 rounded-2xl border border-border bg-card p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                Supplier catalog
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
                Products
              </h2>
              <p className="mt-1 text-sm text-muted-fg">{productsLabel}</p>
            </div>

            <PortalSearchBar
              value={query}
              onChange={setQuery}
              placeholder="Search this seller's products..."
              className="w-full lg:max-w-md"
            />
          </div>

          {productsError ? (
            <p className="mt-5 rounded-xl border border-error/20 bg-error-soft p-3 text-sm text-error">
              {productsError}
            </p>
          ) : null}

          {productsLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-fg">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Loading products...
            </div>
          ) : products.length === 0 ? (
            <PortalEmptyState
              icon={Package}
              title={query.trim() ? "No matching products" : "No products yet"}
              description={
                query.trim()
                  ? "Try a different search term."
                  : "This seller has not listed any products."
              }
            />
          ) : (
            <>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {products.map((product) => (
                  <PortalProductCard key={product.id} product={product} />
                ))}
              </div>
              <PortalInfiniteScroll
                hasMore={hasMore}
                loading={productsLoading}
                loadingMore={loadingMore}
                onLoadMore={loadMore}
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
