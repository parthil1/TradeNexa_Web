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
  { label: "Add Product", href: "/seller/add-product", icon: Plus, color: "text-[#1565C0]" },
  { label: "Messages", href: "/seller/leads", icon: MessageSquare, color: "text-[#8B5CF6]" },
  { label: "My Catalog", href: "/seller/catalog", icon: Package, color: "text-[#F59E0B]" },
  { label: "Analytics", href: "/seller/analytics", icon: TrendingUp, color: "text-[#2E7D32]" },
];

export default function SellerDashboardPage() {
  const { user } = useAuth();
  const recentLeads = demoLeads.slice(0, 3);

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <p className="text-sm text-[#546E7A]">Welcome back,</p>
        <h2 className="text-2xl font-extrabold text-[#0D1B2A] sm:text-3xl">
          {user?.company || user?.name || "Seller"}
        </h2>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-[#1565C0] to-[#5E92F3] p-6 text-white shadow-xl shadow-[#1565C0]/25 sm:p-8"
      >
        <div className="flex items-start justify-between">
          <p className="text-sm text-white/80">Total Revenue</p>
          <span className="inline-flex items-center gap-1 rounded-lg bg-white/20 px-2 py-1 text-xs font-bold">
            <TrendingUp className="h-3.5 w-3.5" />
            +12.5%
          </span>
        </div>
        <p className="mt-2 text-4xl font-extrabold sm:text-5xl">₹12,45,000</p>
        <div className="mt-6 flex items-end justify-between gap-2">
          {chartHeights.map((h, i) => (
            <div key={chartDays[i] + i} className="flex flex-col items-center gap-2">
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.2 + i * 0.08, duration: 0.5 }}
                style={{ height: h, originY: 1 }}
                className={`w-6 rounded-md ${i === 5 ? "bg-white" : "bg-white/40"}`}
              />
              <span className="text-[10px] text-white/70">{chartDays[i]}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <PortalSection title="Performance Overview">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <PortalStatCard title="New Leads" value="48" icon={MessageSquare} color="text-[#FF6D00]" bg="bg-orange-50" />
          <PortalStatCard title="Profile Views" value="1.2k" icon={Eye} color="text-[#2E7D32]" bg="bg-emerald-50" />
          <PortalStatCard title="Active Listings" value="24" icon={Package} color="text-[#1565C0]" bg="bg-blue-50" />
          <PortalStatCard title="Conversion" value="+12.5%" icon={TrendingUp} color="text-[#F59E0B]" bg="bg-amber-50" />
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
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#E8ECF0] bg-white shadow-sm transition hover:shadow-md">
                  <Icon className={`h-7 w-7 ${action.color}`} />
                </div>
                <span className="text-center text-[11px] font-bold text-[#546E7A]">{action.label}</span>
              </Link>
            );
          })}
        </div>
      </PortalSection>

      <PortalSection
        title="Recent Leads"
        action={
          <Link href="/seller/leads" className="text-sm font-bold text-[#1565C0]">
            View all
          </Link>
        }
      >
        <div className="space-y-3">
          {recentLeads.map((lead) => (
            <Link
              key={lead.id}
              href={`/seller/lead/${lead.id}`}
              className="flex items-start gap-4 rounded-2xl border border-[#E8ECF0] bg-white p-4 transition hover:shadow-md"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E8EFF9] text-sm font-extrabold text-[#1565C0]">
                {lead.buyerName[0]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-extrabold text-[#0D1B2A]">{lead.buyerName}</p>
                  <span className="shrink-0 text-[10px] font-semibold text-[#546E7A]">{lead.time}</span>
                </div>
                <p className="mt-0.5 text-xs text-[#546E7A]">{lead.company}</p>
                <p className="mt-2 line-clamp-2 text-sm text-[#0D1B2A]">{lead.requirement}</p>
              </div>
            </Link>
          ))}
        </div>
      </PortalSection>

      <Link
        href="/seller/plans"
        className="flex items-center gap-4 rounded-2xl border border-[#E8ECF0] bg-white p-4 transition hover:border-[#FF6D00]/40"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#E65100] to-[#FF6D00]">
          <Store className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-sm font-extrabold text-[#0D1B2A]">Upgrade Your Plan</p>
          <p className="text-xs text-[#546E7A]">Unlock premium leads & analytics</p>
        </div>
      </Link>
    </div>
  );
}
