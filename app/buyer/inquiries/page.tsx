"use client";

import React, { useState } from "react";
import Link from "next/link";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import { demoInquiries, type InquiryStatus } from "@/data/portalDemo";

const tabs = ["all", "pending", "quoted", "closed"] as const;
const statusStyles: Record<InquiryStatus, string> = {
  pending: "bg-amber-50 text-amber-700",
  quoted: "bg-emerald-50 text-emerald-700",
  closed: "bg-slate-100 text-slate-600",
};

export default function BuyerInquiriesPage() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("all");
  const filtered =
    activeTab === "all" ? demoInquiries : demoInquiries.filter((i) => i.status === activeTab);

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 lg:px-8">
      <PortalPageHeader title="My Inquiries" subtitle="Track your RFQs and quotes" />
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold capitalize transition ${
              activeTab === tab ? "bg-[#1565C0] text-white" : "bg-white text-[#546E7A] border border-[#E0E6ED]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.map((inquiry) => (
          <div key={inquiry.id} className="rounded-2xl border border-[#E8ECF0] bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-extrabold text-[#0D1B2A]">{inquiry.productName}</p>
                <p className="text-xs text-[#546E7A]">{inquiry.supplierName}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${statusStyles[inquiry.status]}`}>
                {inquiry.status}
              </span>
            </div>
            <p className="mt-2 text-sm text-[#546E7A]">{inquiry.message}</p>
            <div className="mt-3 flex items-center justify-between text-xs text-[#546E7A]">
              <span>Qty: {inquiry.quantity}</span>
              <span>{inquiry.date}</span>
            </div>
          </div>
        ))}
      </div>
      <Link
        href="/buyer/send-inquiry"
        className="mt-6 flex w-full items-center justify-center rounded-2xl bg-[#1565C0] py-3.5 text-sm font-bold text-white"
      >
        New Inquiry
      </Link>
    </div>
  );
}
