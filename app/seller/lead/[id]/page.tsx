"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PortalBackLink from "@/components/portal/PortalBackLink";
import { demoLeads } from "@/data/portalDemo";
import { showSuccessToast } from "@/utils/toast";

export default function SellerLeadDetailPage() {
  const params = useParams();
  const lead = demoLeads.find((l) => l.id === params.id) ?? demoLeads[0];

  return (
    <div className="mx-auto max-w-xl px-4 py-5 sm:px-6 lg:px-8">
      <PortalBackLink href="/seller/leads" label="All Leads" />
      <div className="rounded-3xl border border-[#E8ECF0] bg-white p-6">
        <p className="text-xs font-bold uppercase tracking-wider text-[#FF6D00]">{lead.status}</p>
        <h2 className="mt-2 text-xl font-extrabold text-[#0D1B2A]">{lead.buyerName}</h2>
        <p className="text-sm text-[#546E7A]">{lead.company} · {lead.location}</p>
        <div className="mt-6 rounded-2xl bg-[#F4F6F9] p-4">
          <p className="text-sm font-extrabold text-[#0D1B2A]">Requirement</p>
          <p className="mt-2 text-sm text-[#546E7A]">{lead.requirement}</p>
          <p className="mt-2 text-xs text-[#546E7A]">Quantity: {lead.quantity}</p>
        </div>
        <button
          type="button"
          onClick={() => showSuccessToast("Quote sent to buyer!")}
          className="mt-6 w-full rounded-2xl bg-[#1565C0] py-3.5 text-sm font-bold text-white"
        >
          Send Quote
        </button>
        <Link href="/seller/leads" className="mt-3 block text-center text-sm font-semibold text-[#546E7A]">
          Back to inbox
        </Link>
      </div>
    </div>
  );
}
