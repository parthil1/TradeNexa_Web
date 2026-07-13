"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, MessageSquare, Package, Plus, Store, TrendingUp } from "lucide-react";
import PortalStatCard from "@/components/portal/PortalStatCard";
import PortalSection from "@/components/portal/PortalSection";
import { useAuth } from "@/hooks/useAuth";
import { chartDays, chartHeights, demoLeads } from "@/data/portalDemo";

const quickActions = [
  { label: "Add Product", href: "/seller/add-product", icon: Plus, color: "text-primary", bg: "bg-primary-soft" },
  { label: "Messages", href: "/seller/leads", icon: MessageSquare, color: "text-foreground", bg: "bg-muted" },
  { label: "My Catalog", href: "/seller/catalog", icon: Package, color: "text-warning", bg: "bg-amber-50" },
  { label: "Analytics", href: "/seller/analytics", icon: TrendingUp, color: "text-success", bg: "bg-emerald-50" },
];

export default function SellerDashboardPage() {
  const { user } = useAuth();
  const recentLeads = demoLeads.slice(0, 3);

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-6"
      >
        <p className="text-sm text-muted-fg">Welcome back,</p>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {user?.company || user?.name || "Seller"}
        </h2>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.35 }}
        className="relative mb-8 overflow-hidden rounded-xl bg-navy p-6 text-white shadow-[var(--shadow-elevated)] sm:p-8"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgb(21_101_192/0.35),transparent_55%)]" />
        <div className="relative">
          <div className="flex items-start justify-between">
            <p className="text-sm text-white/70">Total Revenue</p>
            <span className="inline-flex items-center gap-1 rounded-lg bg-white/15 px-2 py-1 text-xs font-semibold">
              <TrendingUp className="h-3.5 w-3.5" aria-hidden />
              +12.5%
            </span>
          </div>
          <p className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">₹12,45,000</p>
          <div className="mt-6 flex items-end justify-between gap-2">
            {chartHeights.map((h, i) => (
              <div key={chartDays[i] + i} className="flex flex-col items-center gap-2">
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: 0.2 + i * 0.08, duration: 0.45 }}
                  style={{ height: h, originY: 1 }}
                  className={`w-6 rounded-md ${i === 5 ? "bg-white" : "bg-white/35"}`}
                />
                <span className="text-[10px] text-white/60">{chartDays[i]}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <PortalSection title="Performance Overview">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <PortalStatCard
            title="New Leads"
            value="48"
            icon={MessageSquare}
            color="text-accent"
            bg="bg-portal-seller-light"
          />
          <PortalStatCard
            title="Profile Views"
            value="1.2k"
            icon={Eye}
            color="text-success"
            bg="bg-emerald-50"
          />
          <PortalStatCard
            title="Active Listings"
            value="24"
            icon={Package}
            color="text-primary"
            bg="bg-primary-soft"
          />
          <PortalStatCard
            title="Conversion"
            value="+12.5%"
            icon={TrendingUp}
            color="text-warning"
            bg="bg-amber-50"
          />
        </div>
      </PortalSection>

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
                  className={`flex h-14 w-14 items-center justify-center rounded-xl border border-border shadow-[var(--shadow-card)] transition-shadow duration-200 hover:shadow-[var(--shadow-elevated)] ${action.bg}`}
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

      <PortalSection
        title="Recent Leads"
        action={
          <Link
            href="/seller/leads"
            className="text-sm font-semibold text-primary transition-colors duration-200 hover:text-primary-hover"
          >
            View all
          </Link>
        }
      >
        <div className="space-y-3">
          {recentLeads.map((lead) => (
            <Link
              key={lead.id}
              href={`/seller/lead/${lead.id}`}
              className="surface-card-hover flex items-start gap-4 p-4"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                {lead.buyerName[0]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-foreground">{lead.buyerName}</p>
                  <span className="shrink-0 text-[10px] font-semibold text-muted-fg">{lead.time}</span>
                </div>
                <p className="mt-0.5 text-xs text-muted-fg">{lead.company}</p>
                <p className="mt-2 line-clamp-2 text-sm text-foreground">{lead.requirement}</p>
              </div>
            </Link>
          ))}
        </div>
      </PortalSection>

      <Link
        href="/seller/plans"
        className="surface-card-hover flex items-center gap-4 p-4 transition-colors duration-200 hover:border-accent/40"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
          <Store className="h-6 w-6 text-white" aria-hidden />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Upgrade Your Plan</p>
          <p className="text-xs text-muted-fg">Unlock premium leads & analytics</p>
        </div>
      </Link>
    </div>
  );
}
