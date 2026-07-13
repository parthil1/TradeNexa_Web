"use client";

import React from "react";
import SectionHeading from "@/components/SectionHeading";
import BenefitCard from "@/components/BenefitCard";
import CTABanner from "@/components/CTABanner";
import MarketplacePageHero from "@/components/catalog/marketplace/MarketplacePageHero";
import { MARKETPLACE_CONTAINER } from "@/components/catalog/marketplace/marketplaceLayout";
import { useApp } from "@/app/context/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/common/Button";
import { Building, Upload, ShieldCheck, Mail, LineChart, Globe } from "lucide-react";

export default function SellerBenefits() {
  const { openRegisterModal } = useApp();
  const { isAuthenticated } = useAuth();

  const benefits = [
    {
      icon: Building,
      title: "Business Profile Setup",
      description: "Establish a comprehensive corporate profile listing address, registration details, catalog links, and operational scale.",
      points: [
        "Include GSTIN and business registration verification.",
        "Add custom company brochures and branding logos.",
        "Highlight factory size, export status, and capabilities.",
      ],
      highlighted: false,
    },
    {
      icon: Upload,
      title: "Unlimited Product Listings",
      description: "List your complete product catalog, specify distinct models, list dimensions, and outline wholesale bulk discount levels.",
      points: [
        "No listing caps or high subscription listing boundaries.",
        "Detailed descriptions, technical specifications, and rich graphics.",
        "Manage prices dynamically in response to market raw material rates.",
      ],
      highlighted: true,
    },
    {
      icon: Globe,
      title: "Business Visibility",
      description: "Stand out in search query results. Our SEO-friendly category system feeds detailed product listings straight into search engines.",
      points: [
        "Optimized pages designed for high search result ranking.",
        "Dedicated category mapping based on product keywords.",
        "Clean sharing URLs to promote your catalog externally.",
      ],
      highlighted: false,
    },
    {
      icon: Mail,
      title: "Lead Generation",
      description: "Receive hot, actionable business leads from commercial buyers looking for products in your specific category.",
      points: [
        "Direct RFQs sent straight to your email or dashboard.",
        "Verified buyer contact details including phone numbers.",
        "Filter and categorize incoming leads by region or budget.",
      ],
      highlighted: false,
    },
    {
      icon: LineChart,
      title: "Inquiry Management",
      description: "Use simplified messaging setups to follow up with leads, dispatch custom quotes, and keep track of negotiations.",
      points: [
        "Receive instant notifications for every inquiry.",
        "Track customer follow-up statuses inside your workspace.",
        "Archive past communications for long-term customer relations.",
      ],
      highlighted: false,
    },
    {
      icon: ShieldCheck,
      title: "Professional Online Presence",
      description: "Generate instant credibility. Your catalog serves as a clean, responsive mini-website that you can share with potential clients.",
      points: [
        "Modern layout that renders perfectly on mobile viewports.",
        "Integrated inquiry form on every product page.",
        "Verification status badge highlighting your business trust.",
      ],
      highlighted: false,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketplacePageHero
        eyebrow="For Sellers"
        title="Empowering Sellers to Scale Digital Trade"
        subtitle="List your business catalog on India's smart marketplace directory. Attract verified procurers and collect direct sales inquiries without paying commission."
      >
        {!isAuthenticated && (
          <Button onClick={() => openRegisterModal("seller")}>
            Get Started as a Seller
          </Button>
        )}
      </MarketplacePageHero>

      <section className="flex-1 py-12 lg:py-16">
        <div className={MARKETPLACE_CONTAINER}>
          <SectionHeading
            badge="Features"
            title="Sellers Growth Suite"
            subtitle="Discover everything you receive when launching your catalog pages on our platform."
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
                badge={b.highlighted ? "Most listed" : undefined}
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
