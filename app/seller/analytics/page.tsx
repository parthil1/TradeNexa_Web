"use client";

import React from "react";
import { BarChart3, Eye, MessageSquare, TrendingUp } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import PortalStatCard from "@/components/portal/PortalStatCard";
import { chartDays, chartHeights } from "@/data/portalDemo";

export default function SellerAnalyticsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      <PortalPageHeader title="Analytics" subtitle="Track your business performance" />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <PortalStatCard title="Views" value="3.4k" icon={Eye} color="text-[#1565C0]" bg="bg-blue-50" />
        <PortalStatCard title="Leads" value="48" icon={MessageSquare} color="text-[#FF6D00]" bg="bg-orange-50" />
        <PortalStatCard title="Conversion" value="18%" icon={TrendingUp} color="text-[#2E7D32]" bg="bg-emerald-50" />
        <PortalStatCard title="Revenue" value="₹12.4L" icon={BarChart3} color="text-[#8B5CF6]" bg="bg-violet-50" />
      </div>
      <div className="rounded-3xl border border-[#E8ECF0] bg-white p-6">
        <p className="text-sm font-extrabold text-[#0D1B2A]">Weekly Profile Views</p>
        <div className="mt-6 flex items-end justify-between gap-2">
          {chartHeights.map((h, i) => (
            <div key={chartDays[i] + i} className="flex flex-1 flex-col items-center gap-2">
              <div style={{ height: h }} className="w-full max-w-8 rounded-md bg-gradient-to-t from-[#1565C0] to-[#5E92F3]" />
              <span className="text-[10px] text-[#546E7A]">{chartDays[i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
