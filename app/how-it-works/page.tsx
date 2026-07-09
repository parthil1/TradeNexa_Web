"use client";

import React, { useState } from "react";
import Link from "next/link";
import SectionHeading from "@/components/SectionHeading";
import CTABanner from "@/components/CTABanner";
import MarketplacePageHero from "@/components/catalog/marketplace/MarketplacePageHero";
import { MARKETPLACE_CONTAINER } from "@/components/catalog/marketplace/marketplaceLayout";
import { useApp } from "@/app/context/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import {
  UserPlus,
  Building,
  Upload,
  MessageSquare,
  TrendingUp,
  Search,
  CheckCircle,
  MailQuestion,
  Users2,
  ShieldCheck,
  ArrowRight,
  ArrowLeftRight,
  Store,
  ShoppingCart,
} from "lucide-react";

type TabRole = "sellers" | "buyers" | "both";

export default function HowItWorks() {
  const { openRegisterModal } = useApp();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<TabRole>("sellers");

  const sellerSteps = [
    { title: "Create Account", desc: "Sign up in 30 seconds using your mobile number and business details.", icon: UserPlus },
    { title: "Create Business Profile", desc: "Add GST credentials, office addresses, and categories to build trust.", icon: Building },
    { title: "Upload Products", desc: "List bulk supplies, upload catalogs, and define flexible pricing terms.", icon: Upload },
    { title: "Receive Buyer Inquiries", desc: "Interested procurers send purchase requirements. You get alerts instantly.", icon: MessageSquare },
    { title: "Grow Business", desc: "Respond via WhatsApp, call, or email to finalize bulk sales nationwide.", icon: TrendingUp },
  ];

  const buyerSteps = [
    { title: "Search Products", desc: "Use keyword search or filters to locate products, supplies, and manufacturers.", icon: Search },
    { title: "Compare Sellers", desc: "Review verification badges, catalogs, and filter by logistics capability.", icon: CheckCircle },
    { title: "Send Inquiry", desc: "Fill in the RFQ form specifying quantities and specifications.", icon: MailQuestion },
    { title: "Connect Directly", desc: "Communicate with sellers via phone, email, or chat — no platform fees.", icon: Users2 },
    { title: "Purchase with Confidence", desc: "Finalize payment and delivery conditions with your verified partner.", icon: ShieldCheck },
  ];

  const bothSteps = [
    { title: "Register Once", desc: "Choose 'Both' during signup to enable buyer and seller capabilities in one account.", icon: ArrowLeftRight },
    { title: "Set Up Dual Profile", desc: "Configure your buying needs and selling catalog from a unified dashboard.", icon: Building },
    { title: "Source & Supply", desc: "Procure raw materials from other sellers while listing your own products.", icon: Store },
    { title: "Manage Both Flows", desc: "Track incoming RFQs and outgoing purchase inquiries in one place.", icon: ShoppingCart },
    { title: "Scale Both Sides", desc: "Expand sourcing networks and customer base simultaneously across India.", icon: TrendingUp },
  ];

  const tabs: { id: TabRole; label: string }[] = [
    { id: "sellers", label: "For Sellers" },
    { id: "buyers", label: "For Buyers" },
    { id: "both", label: "For Both" },
  ];

  const tabConfig = {
    sellers: {
      badge: "Seller Journey",
      title: "List, Discover, and Scale",
      subtitle: "Five simple steps to take your offline manufacturing or wholesale trade digital.",
      steps: sellerSteps,
      cta: { label: "Start Listing Your Products", role: "seller" as const },
    },
    buyers: {
      badge: "Buyer Journey",
      title: "Locate, Request, and Negotiate",
      subtitle: "Five straightforward milestones for sourcing bulk materials safely and quickly.",
      steps: buyerSteps,
      cta: { label: "Browse Product Catalog", href: "/categories" },
    },
    both: {
      badge: "Dual-Role Journey",
      title: "Buy, Sell, and Grow Together",
      subtitle: "One account for businesses that source materials and sell finished goods.",
      steps: bothSteps,
      cta: { label: "Register as Buyer & Seller", role: "both" as const },
    },
  };

  const config = tabConfig[activeTab];

  const renderCta = () => {
    if (activeTab === "buyers") {
      return (
        <Link
          href="/categories"
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-600"
        >
          Browse Product Catalog
          <ArrowRight className="h-4 w-4" />
        </Link>
      );
    }
    if (isAuthenticated) return null;
    const role = activeTab === "sellers" ? "seller" : "both";
    return (
      <button
        onClick={() => openRegisterModal(role)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-600"
      >
        {config.cta.label}
        <ArrowRight className="h-4 w-4" />
      </button>
    );
  };

  const cta = renderCta();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <MarketplacePageHero
        eyebrow="Ecosystem"
        title="How Our Marketplace Connects Businesses"
        subtitle="Whether you sell, buy, or do both — here is how TradeNexa works for your business."
      >
        <div className="inline-flex rounded-xl border border-white/20 bg-white/10 p-1.5 backdrop-blur-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition-all sm:px-6 ${
                activeTab === tab.id
                  ? "bg-white text-[#1a2b4c] shadow"
                  : "text-blue-100/90 hover:bg-white/10 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </MarketplacePageHero>

      <section className="flex-1 py-12 lg:py-16">
        <div className={MARKETPLACE_CONTAINER}>
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="mb-2 inline-block rounded bg-primary/15 px-2.5 py-0.5 text-xs font-bold uppercase text-primary">
              {config.badge}
            </span>
            <h2 className="text-2xl font-bold text-[#1a2b4c]">{config.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{config.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
            {config.steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-lg"
                >
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-2xl font-black text-slate-200 transition-colors group-hover:text-primary/20">
                        0{idx + 1}
                      </span>
                    </div>
                    <h3 className="mb-2 text-base font-bold text-[#1a2b4c]">{step.title}</h3>
                    <p className="text-xs leading-relaxed text-slate-500">{step.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {cta && <div className="mt-12 text-center">{cta}</div>}
        </div>
      </section>

      <CTABanner />
    </div>
  );
}
