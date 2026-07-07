"use client";

import React, { useState } from "react";
import Link from "next/link";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import { demoLeads, type LeadStatus } from "@/data/portalDemo";

const tabs = ["all", "new", "responded", "won", "lost"] as const;
const statusStyles: Record<LeadStatus, string> = {
  new: "bg-blue-50 text-blue-700",
  responded: "bg-violet-50 text-violet-700",
  won: "bg-emerald-50 text-emerald-700",
  lost: "bg-slate-100 text-slate-600",
};

export default function SellerLeadsPage() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("all");
  const filtered = activeTab === "all" ? demoLeads : demoLeads.filter((l) => l.status === activeTab);

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 lg:px-8">
      <PortalPageHeader title="Lead Inbox" subtitle="Buyer inquiries and RFQs" />
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold capitalize ${
              activeTab === tab ? "bg-[#FF6D00] text-white" : "bg-white text-[#546E7A] border border-[#E0E6ED]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.map((lead) => (
          <Link
            key={lead.id}
            href={`/seller/lead/${lead.id}`}
            className="block rounded-2xl border border-[#E8ECF0] bg-white p-4 transition hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-extrabold text-[#0D1B2A]">{lead.buyerName}</p>
                <p className="text-xs text-[#546E7A]">{lead.company} · {lead.location}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${statusStyles[lead.status]}`}>
                {lead.status}
              </span>
            </div>
            <p className="mt-2 text-sm text-[#0D1B2A]">{lead.requirement}</p>
            <p className="mt-2 text-xs text-[#546E7A]">{lead.time} · {lead.quantity}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
