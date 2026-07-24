"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ClipboardList,
  Eye,
  Loader2,
  MessageSquare,
  Package,
  Plus,
  Reply,
  TrendingUp,
  XCircle,
} from "lucide-react";
import PortalStatCard from "@/components/portal/PortalStatCard";
import PortalSection from "@/components/portal/PortalSection";
import { useAuth } from "@/hooks/useAuth";
import { fetchSellerDashboard } from "@/services/sellerDashboardService";
import type { SellerDashboardData } from "@/types/sellerDashboard";
import { formatPrice, productGradient, resolveImageUrl } from "@/utils/catalogHelpers";

const quickActions = [
  { label: "Add Product", href: "/seller/add-product", icon: Plus, color: "text-primary", bg: "bg-primary-soft" },
  { label: "Leads", href: "/seller/leads", icon: MessageSquare, color: "text-foreground", bg: "bg-muted" },
  { label: "My Catalog", href: "/seller/catalog", icon: Package, color: "text-warning", bg: "bg-warning-soft" },
];

function formatCount(value: number): string {
  return new Intl.NumberFormat("en-IN").format(value);
}

function formatLabel(value: string): string {
  return value.replace(/_/g, " ");
}

export default function SellerDashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<SellerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const displayName = user?.name || user?.company || "Seller";
  const initial = displayName.charAt(0).toUpperCase();

  const loadDashboard = () => {
    setLoading(true);
    setError(null);
    return fetchSellerDashboard()
      .then(setDashboard)
      .catch(() => setError("Could not load seller dashboard."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchSellerDashboard()
      .then((data) => {
        if (!cancelled) setDashboard(data);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load seller dashboard.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const top = dashboard?.top_performing_product ?? null;
  const thumb = top ? resolveImageUrl(top.thumbnail) : null;
  const breakdown = dashboard?.todays_leads_breakdown;

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
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

      <PortalSection title="Quick Actions">
        <div className="flex gap-4 overflow-x-auto pb-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="flex w-24 shrink-0 flex-col items-center gap-2"
              >
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-xl border border-border transition-colors duration-200 hover:border-primary/30 ${action.bg}`}
                >
                  <Icon className={`h-6 w-6 ${action.color}`} aria-hidden />
                </div>
                <span className="text-center text-[11px] font-semibold text-muted-fg">
                  {action.label}
                </span>
              </Link>
            );
          })}
        </div>
      </PortalSection>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
        </div>
      ) : error ? (
        <div className="surface-card mb-8 p-6 text-center">
          <p className="text-sm text-muted-fg">{error}</p>
          <button
            type="button"
            className="mt-3 text-sm font-semibold text-primary"
            onClick={() => void loadDashboard()}
          >
            Try again
          </button>
        </div>
      ) : dashboard ? (
        <>
          <PortalSection title="Performance Overview">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <PortalStatCard
                title="Total Products"
                value={formatCount(dashboard.total_products)}
                icon={Package}
                color="text-primary"
                bg="bg-primary-soft"
                href="/seller/catalog"
              />
              <PortalStatCard
                title="Today's Leads"
                value={formatCount(dashboard.todays_leads)}
                icon={MessageSquare}
                color="text-accent"
                bg="bg-portal-seller-light"
                href="/seller/leads"
              />
              <PortalStatCard
                title="Profile Views"
                value={formatCount(dashboard.profile_views)}
                icon={Eye}
                color="text-success"
                bg="bg-success-soft"
              />
              <PortalStatCard
                title="Replies Sent"
                value={formatCount(dashboard.replies_sent)}
                icon={Reply}
                color="text-warning"
                bg="bg-warning-soft"
              />
            </div>
          </PortalSection>

          <PortalSection title="Today's Leads Breakdown">
            <div className="grid grid-cols-2 gap-3">
              <PortalStatCard
                title="Inquiries"
                value={formatCount(breakdown?.inquiries ?? 0)}
                icon={ClipboardList}
                color="text-primary"
                bg="bg-primary-soft"
                href="/seller/inquiries"
                compact
              />
              <PortalStatCard
                title="RFQ Invites"
                value={formatCount(breakdown?.rfq_invites ?? 0)}
                icon={MessageSquare}
                color="text-accent"
                bg="bg-portal-seller-light"
                href="/seller/leads"
                compact
              />
            </div>
          </PortalSection>

          <PortalSection title="Top Performing Product">
            {top ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="surface-card overflow-hidden p-0"
              >
                <div className="border-b border-border bg-muted/40 px-4 py-3 sm:px-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Ranked by {formatLabel(top.ranking_method)}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-fg">Product ID #{top.id}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">
                      <TrendingUp className="h-3.5 w-3.5" aria-hidden />
                      {formatCount(top.inquiries_total)} total inquiries
                    </span>
                  </div>
                </div>

                <Link
                  href={`/seller/product/${top.id}`}
                  className="flex items-start gap-4 p-4 transition-colors hover:bg-muted/30 sm:p-5"
                >
                  {thumb ? (
                    <img
                      src={thumb}
                      alt=""
                      className="h-20 w-20 shrink-0 rounded-xl object-cover sm:h-24 sm:w-24"
                    />
                  ) : (
                    <div
                      className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br sm:h-24 sm:w-24 ${productGradient(top.id)}`}
                    >
                      <Package className="h-8 w-8 text-white/85" aria-hidden />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-foreground sm:text-lg">{top.name}</p>
                    {top.slug ? (
                      <p className="mt-0.5 truncate text-xs text-muted-fg">{top.slug}</p>
                    ) : null}
                    <p className="mt-2 text-sm font-medium text-foreground">
                      {formatPrice(top.price, top.currency)}
                      {top.unit ? (
                        <span className="font-normal text-muted-fg"> / {top.unit}</span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-xs text-muted-fg">MOQ: {formatCount(top.moq)}</p>
                  </div>
                </Link>

                <div className="grid grid-cols-2 gap-px border-t border-border bg-border sm:grid-cols-4">
                  <div className="bg-card px-4 py-3">
                    <p className="text-[11px] font-medium text-muted-fg">Total inquiries</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {formatCount(top.inquiries_total)}
                    </p>
                  </div>
                  <div className="bg-card px-4 py-3">
                    <p className="text-[11px] font-medium text-muted-fg">Pending</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {formatCount(top.inquiries_pending)}
                    </p>
                  </div>
                  <div className="bg-card px-4 py-3">
                    <p className="text-[11px] font-medium text-muted-fg">Quoted</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {formatCount(top.inquiries_quoted)}
                    </p>
                  </div>
                  <div className="bg-card px-4 py-3">
                    <p className="text-[11px] font-medium text-muted-fg">Accepted</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {formatCount(top.inquiries_accepted)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 border-t border-border px-4 py-3 sm:px-5">
                  <span className="inline-flex items-center rounded-lg bg-muted px-2.5 py-1 text-xs font-semibold capitalize text-foreground">
                    Status: {formatLabel(top.approval_status)}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                      top.is_active
                        ? "bg-success-soft text-success"
                        : "bg-muted text-muted-fg"
                    }`}
                  >
                    {top.is_active ? (
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" aria-hidden />
                    )}
                    {top.is_active ? "Active" : "Inactive"}
                  </span>
                  <span className="inline-flex items-center rounded-lg bg-muted px-2.5 py-1 text-xs font-semibold text-muted-fg">
                    Currency: {top.currency}
                  </span>
                </div>
              </motion.div>
            ) : (
              <div className="surface-card p-6 text-center">
                <p className="text-sm text-muted-fg">No top performing product yet.</p>
                <Link
                  href="/seller/add-product"
                  className="mt-2 inline-block text-sm font-semibold text-primary"
                >
                  Add a product
                </Link>
              </div>
            )}
          </PortalSection>
        </>
      ) : null}
    </div>
  );
}
