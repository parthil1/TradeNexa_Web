"use client";

import React from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/common/Button";
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
                ? "border-primary bg-gradient-to-b from-primary-soft to-card shadow-lg"
                : "border-border bg-card"
            }`}
          >
            {plan.highlight ? (
              <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase text-white">
                Popular
              </span>
            ) : null}
            <h3 className="mt-3 text-lg font-extrabold text-foreground">{plan.name}</h3>
            <p className="mt-2">
              <span className="text-3xl font-extrabold text-foreground">{plan.price}</span>
              <span className="text-sm text-muted-fg">{plan.period}</span>
            </p>
            <ul className="mt-6 space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-fg">
                  <Check className="h-4 w-4 shrink-0 text-success" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              variant={plan.highlight ? "primary" : "secondary"}
              fullWidth
              className="mt-6 py-3 text-sm"
            >
              {plan.name === "Free" ? "Current Plan" : "Upgrade"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
