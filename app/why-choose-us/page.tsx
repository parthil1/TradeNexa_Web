"use client";

import React from "react";
import SectionHeading from "@/components/SectionHeading";
import CTABanner from "@/components/CTABanner";
import MarketplacePageHero from "@/components/catalog/marketplace/MarketplacePageHero";
import { MARKETPLACE_CONTAINER } from "@/components/catalog/marketplace/marketplaceLayout";
import { Check, X } from "lucide-react";
import { motion } from "framer-motion";

export default function WhyChooseUs() {
  const comparisonItems = [
    {
      feature: "Lead Generation Speed",
      traditional: "Months searching contacts at local expos and directories",
      platform: "Instant buyer inquiries directly inside your dashboard",
    },
    {
      feature: "Market Coverage",
      traditional: "Limited to your local region or state buyers",
      platform: "Nationwide visibility across all major Indian cities",
    },
    {
      feature: "Verification Trust",
      traditional: "Uncertain buyers and high risk of non-payment",
      platform: "Strict profile check badge showing authenticated companies",
    },
    {
      feature: "Product Showcasing",
      traditional: "Paper booklets or expensive custom websites",
      platform: "Unlimited listing catalog with rich photos and description",
    },
    {
      feature: "Direct Negotiations",
      traditional: "Intermediaries and brokers taking high cut commission",
      platform: "Zero brokerage. Direct buyer-to-seller negotiation",
    },
    {
      feature: "Accessibility",
      traditional: "Only manageable from physical office desk documents",
      platform: "Mobile-responsive tracking anywhere, anytime",
    },
  ];

  const highlights = [
    {
      title: "Faster Inquiries",
      desc: "Connect directly with manufacturers and sellers without waiting for agents or trade show dates.",
    },
    {
      title: "Better Visibility",
      desc: "SEO-friendly product structures help listings appear directly inside search results.",
    },
    {
      title: "Easy Product Listing",
      desc: "Load specifications, prices, images, and descriptions in minutes — no heavy website build costs.",
    },
    {
      title: "Verified Business Profiles",
      desc: "GST and corporate record validation builds instant confidence for buyers placing large orders.",
    },
    {
      title: "Simple Communication",
      desc: "Instant inquiry updates routed directly through text or mail, connecting buyers and sellers without friction.",
    },
    {
      title: "Nationwide Exposure",
      desc: "List products in New Delhi and gather inquiries from Chennai or Mumbai. Expand beyond physical borders.",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketplacePageHero
        eyebrow="Comparison"
        title="Why Choose Our Marketplace?"
        subtitle="See how listing and sourcing on our modernized B2B marketplace stacks up against traditional, offline commercial channels."
      />

      <section className="flex-1 py-12 lg:py-16">
        <div className={MARKETPLACE_CONTAINER}>
          <SectionHeading
            badge="Versus"
            title="Traditional Business vs. Our B2B Marketplace"
            subtitle="Comparing key indicators affecting bulk lead generation and procurement speeds."
          />

          <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
            <table className="w-full border-collapse text-left text-sm text-muted-fg">
              <thead className="border-b border-border bg-muted">
                <tr>
                  <th className="px-6 py-4 font-bold text-navy">Feature Segment</th>
                  <th className="bg-red-50/50 px-6 py-4 font-bold text-red-600">
                    Traditional Business Channels
                  </th>
                  <th className="bg-primary-soft px-6 py-4 font-bold text-primary">
                    Our Premium B2B Marketplace
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {comparisonItems.map((item, idx) => (
                  <motion.tr
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.05 }}
                    className="transition-colors hover:bg-muted/50"
                  >
                    <td className="px-6 py-5 font-semibold text-navy">{item.feature}</td>
                    <td className="bg-red-50/30 px-6 py-5">
                      <div className="flex items-start gap-2">
                        <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                        <span>{item.traditional}</span>
                      </div>
                    </td>
                    <td className="bg-primary-soft px-6 py-5">
                      <div className="flex items-start gap-2 font-medium text-navy">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{item.platform}</span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {highlights.map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-border bg-card p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-elevated"
              >
                <h3 className="mb-2 flex items-center gap-2 font-bold text-navy">
                  <Check className="h-5 w-5 text-primary" />
                  {item.title}
                </h3>
                <p className="text-xs leading-relaxed text-muted-fg">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTABanner />
    </div>
  );
}
