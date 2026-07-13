"use client";

import React from "react";
import Link from "next/link";
import SectionHeading from "@/components/SectionHeading";
import BenefitCard from "@/components/BenefitCard";
import CTABanner from "@/components/CTABanner";
import MarketplacePageHero from "@/components/catalog/marketplace/MarketplacePageHero";
import { MARKETPLACE_CONTAINER } from "@/components/catalog/marketplace/marketplaceLayout";
import { Button } from "@/components/common/Button";
import { Search, CheckCircle, List, Zap, Clock, ShieldCheck, ArrowRight } from "lucide-react";

export default function BuyerBenefits() {
  const benefits = [
    {
      icon: Search,
      title: "Easy Search",
      description: "Instantly find bulk industrial materials, components, and goods by keywords, brand models, or industrial segments.",
      points: [
        "Faceted sidebar filters to sort items by region or city.",
        "Keyword auto-suggestions indicating active catalogs.",
        "Mobile-first responsive search layout.",
      ],
      highlighted: false,
    },
    {
      icon: CheckCircle,
      title: "Verified Sellers",
      description: "Source confidently. We verify registered seller profiles by checking PAN, GST registration status, and physical location.",
      points: [
        "Distinct verification trust badge on profiles.",
        "View registered office location and contact details.",
        "Report suspicious catalog listings instantly to admins.",
      ],
      highlighted: true,
    },
    {
      icon: List,
      title: "Multiple Product Options",
      description: "Compare multiple manufacturing suppliers offering the same components or goods in order to achieve competitive bulk pricing.",
      points: [
        "Broader market view across small, medium, and large mills.",
        "Access technical catalogs and downloadable brochures.",
        "Explore related products in identical category pages.",
      ],
      highlighted: false,
    },
    {
      icon: Zap,
      title: "Quick Contact",
      description: "Reach out to target companies directly. Send a digital inquiry or use direct call lines to request quotes in seconds.",
      points: [
        "Direct RFQs forwarded immediately without broker steps.",
        "Integration for direct call, mail, or message channels.",
        "No platform brokerage fees or contact access limits.",
      ],
      highlighted: false,
    },
    {
      icon: Clock,
      title: "Save Time",
      description: "Avoid manual directory phone calls. Distribute a single Request for Quote (RFQ) to multiple sellers simultaneously.",
      points: [
        "Sellers contact you back with pricing quotes.",
        "Receive matching catalogs within hours.",
        "Consolidated dashboard view to manage active inquiries.",
      ],
      highlighted: false,
    },
    {
      icon: ShieldCheck,
      title: "Reliable Marketplace",
      description: "Our structured directory ensures that spam profiles and invalid listings are weeded out, keeping the focus on genuine trade.",
      points: [
        "Constant monitoring of seller activity.",
        "Clean, spam-free interfaces without banner ads.",
        "Direct B2B matching focused purely on business procurement.",
      ],
      highlighted: false,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketplacePageHero
        eyebrow="For Buyers"
        title="Streamlined Bulk Sourcing for Buyers"
        subtitle="Find the right wholesale partner. Source raw materials, machinery, finished goods, and commercial products directly from verified sellers across India."
      >
        <Link href="/categories">
          <Button>
            Start Sourcing Products
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </MarketplacePageHero>

      <section className="flex-1 py-12 lg:py-16">
        <div className={MARKETPLACE_CONTAINER}>
          <SectionHeading
            badge="Solutions"
            title="Procurement Advantages"
            subtitle="Discover how our simplified B2B platform saves weeks of manual vendor sourcing."
          />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b, idx) => (
              <BenefitCard
                key={idx}
                icon={b.icon}
                title={b.title}
                description={b.description}
                points={b.points}
                highlighted={b.highlighted}
                badge={b.highlighted ? "Top rated" : undefined}
                delay={idx * 0.05}
              />
            ))}
          </div>
        </div>
      </section>

      <CTABanner />
    </div>
  );
}
