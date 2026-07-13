"use client";

import React from "react";
import SectionHeading from "@/components/SectionHeading";
import FAQAccordion from "@/components/FAQAccordion";
import CTABanner from "@/components/CTABanner";
import MarketplacePageHero from "@/components/catalog/marketplace/MarketplacePageHero";
import { MARKETPLACE_CONTAINER } from "@/components/catalog/marketplace/marketplaceLayout";

export default function FAQ() {
  const faqItems = [
    {
      question: "How do I become a seller?",
      answer: "Becoming a seller is simple. Click on the 'Become a Seller' button in the navbar, complete the 30-second registration form with your name, company details, phone number, and primary industry category, and submit. Our verification team will review your business credentials and list your catalog live.",
    },
    {
      question: "How do buyers contact sellers?",
      answer: "Buyers can browse products in the Categories grid, click on 'Explore Products & Sellers', and fill in the simple Request for Quote (RFQ) form or select options to send direct inquiry details. The inquiry details are immediately forwarded to the seller via email and text, containing buyer contact details for direct negotiations.",
    },
    {
      question: "Is registration free?",
      answer: "Yes, basic registration and basic product listing are completely free. Our platform is commission-free, meaning buyers and sellers connect directly and settle payment terms offline without paying brokerage to us.",
    },
    {
      question: "Can I upload multiple products?",
      answer: "Absolutely! Sellers are allowed to upload unlimited product listings in their catalog. You can detail technical specifications, dimensions, shipping guidelines, and upload multiple high-resolution photos for each item.",
    },
    {
      question: "How are sellers verified?",
      answer: "Sellers receive a 'Verified' trust badge upon verification of their legal credentials. Our onboarding operations team cross-checks details such as corporate GSTIN, company PAN registration records, and physical office presence to build instant confidence for buyers.",
    },
    {
      question: "What is the difference between a Seller and a Supplier?",
      answer: "Our B2B marketplace uses the standard term 'Seller' to encompass manufacturers, wholesalers, trade agents, and commercial vendors listed on our platform, aligning with a modernized trading terminology.",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketplacePageHero
        eyebrow="Help Center"
        title="Frequently Asked Questions"
        subtitle="Have questions about how to list products, send RFQs, or verify profiles? Explore our quick guidance answers."
      />

      <section className="flex-1 py-12 lg:py-16">
        <div className={MARKETPLACE_CONTAINER}>
          <SectionHeading
            badge="Help"
            title="General Queries"
            subtitle="Frequently asked questions about listing setup, buyer matching, and account trust."
          />
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
            <FAQAccordion items={faqItems} />
          </div>
        </div>
      </section>

      <CTABanner />
    </div>
  );
}
