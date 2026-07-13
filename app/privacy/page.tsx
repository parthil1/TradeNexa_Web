"use client";

import React from "react";
import Link from "next/link";
import MarketplacePageHero from "@/components/catalog/marketplace/MarketplacePageHero";
import { MARKETPLACE_CONTAINER } from "@/components/catalog/marketplace/marketplaceLayout";
import CTABanner from "@/components/CTABanner";

const SECTIONS = [
  {
    title: "What we collect",
    body: "We collect account details you provide (name, company, phone, email), business profile information (address, GST/PAN where applicable), product and RFQ content you submit, and basic usage data needed to operate TradeNexa securely.",
  },
  {
    title: "How we use your data",
    body: "Your data is used to create and manage your account, match buyers and sellers, deliver inquiries and quotations, improve marketplace search and reliability, and communicate important service updates. We do not sell personal information to third parties.",
  },
  {
    title: "Sharing",
    body: "When you post an RFQ, inquiry, or quotation, relevant contact and business details may be shared with the other party so trade conversations can happen directly. We may also share data with infrastructure providers who process it only to run the platform, under appropriate safeguards.",
  },
  {
    title: "Security & retention",
    body: "We apply reasonable technical and organizational measures to protect account and business data. We retain information for as long as your account is active and as needed to provide the service, resolve disputes, and meet legal obligations.",
  },
  {
    title: "Your choices",
    body: "You can update profile details from your portal settings. For account deletion or privacy requests, contact us at contact@tradenexa.com. We will respond in line with applicable Indian data-protection requirements.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketplacePageHero
        eyebrow="Legal"
        title={
          <>
            Privacy <span className="text-primary-soft">Policy</span>
          </>
        }
        subtitle="How TradeNexa collects, uses, and protects business and account information on our B2B marketplace."
        centered={false}
      />

      <section className="flex-1 py-12 lg:py-16">
        <div className={`${MARKETPLACE_CONTAINER} max-w-3xl`}>
          <p className="mb-8 text-sm text-muted-fg">
            Last updated: July 2026. This policy applies to the TradeNexa website and buyer/seller portals.
          </p>

          <div className="space-y-6">
            {SECTIONS.map((section) => (
              <article
                key={section.title}
                className="rounded-xl border border-border bg-card p-5 shadow-card sm:p-6"
              >
                <h2 className="text-base font-bold text-navy">{section.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-fg">{section.body}</p>
              </article>
            ))}
          </div>

          <p className="mt-8 text-sm text-muted-fg">
            Questions?{" "}
            <Link href="/contact" className="font-semibold text-primary hover:underline">
              Contact us
            </Link>{" "}
            or email{" "}
            <a
              href="mailto:contact@tradenexa.com"
              className="font-semibold text-primary hover:underline"
            >
              contact@tradenexa.com
            </a>
            .
          </p>
        </div>
      </section>

      <CTABanner />
    </div>
  );
}
