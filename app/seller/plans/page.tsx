"use client";

import React from "react";
import { Check } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import PortalBackLink from "@/components/portal/PortalBackLink";

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "/month",
    features: ["5 product listings", "Basic lead inbox", "Profile page"],
    highlight: false,
  },
  {
    name: "Silver",
    price: "₹2,999",
    period: "/month",
    features: ["50 product listings", "Priority leads", "Analytics dashboard", "Verified badge"],
    highlight: true,
  },
  {
    name: "Gold",
    price: "₹7,999",
    period: "/month",
    features: ["Unlimited listings", "Featured placement", "Dedicated support", "Advanced analytics"],
    highlight: false,
  },
];

export default function SellerPlansPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6 lg:px-8">
      <PortalBackLink href="/seller/profile" />
      <PortalPageHeader title="Subscription Plans" subtitle="Grow your B2B business on TradeNexa" />
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-3xl border p-6 ${
              plan.highlight
                ? "border-[#1565C0] bg-gradient-to-b from-[#E8EFF9] to-white shadow-lg"
                : "border-[#E8ECF0] bg-white"
            }`}
          >
            {plan.highlight ? (
              <span className="rounded-full bg-[#1565C0] px-3 py-1 text-[10px] font-bold uppercase text-white">
                Popular
              </span>
            ) : null}
            <h3 className="mt-3 text-lg font-extrabold text-[#0D1B2A]">{plan.name}</h3>
            <p className="mt-2">
              <span className="text-3xl font-extrabold text-[#0D1B2A]">{plan.price}</span>
              <span className="text-sm text-[#546E7A]">{plan.period}</span>
            </p>
            <ul className="mt-6 space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-[#546E7A]">
                  <Check className="h-4 w-4 shrink-0 text-[#2E7D32]" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className={`mt-6 w-full rounded-2xl py-3 text-sm font-bold ${
                plan.highlight ? "bg-[#1565C0] text-white" : "border border-[#E0E6ED] text-[#546E7A]"
              }`}
            >
              {plan.name === "Free" ? "Current Plan" : "Upgrade"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
