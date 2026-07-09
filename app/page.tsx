"use client";

import React from "react";
import Link from "next/link";
import { useApp } from "@/app/context/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Search,
  CheckCircle,
  TrendingUp,
  UserPlus,
  Package,
  Layers,
  ArrowRightLeft,
  Smartphone,
  ShieldAlert,
  MapPin,
  HelpCircle,
  Zap,
  Globe,
  Lock,
  Building,
} from "lucide-react";

import SectionHeading from "@/components/SectionHeading";
import ProcessStep from "@/components/ProcessStep";
import CTABanner from "@/components/CTABanner";
import { MARKETPLACE_CONTAINER } from "@/components/catalog/marketplace/marketplaceLayout";
import { MARKETPLACE_NAVY } from "@/utils/marketplaceTheme";

export default function Home() {
  const { openRegisterModal } = useApp();
  const { isAuthenticated } = useAuth();

  const processSteps = [
    {
      number: "1",
      title: "Create Profile",
      description: "Seller creates a detailed, trustable business profile.",
      icon: UserPlus,
    },
    {
      number: "2",
      title: "Upload Products",
      description: "Seller lists products with pricing, specifications, and images.",
      icon: Package,
    },
    {
      number: "3",
      title: "Search & Match",
      description: "Buyer searches products and discovers verified listings.",
      icon: Search,
    },
    {
      number: "4",
      title: "Direct Connect",
      description: "Buyer contacts seller directly to finalize deals.",
      icon: ArrowRightLeft,
    },
  ];

  const features = [
    { icon: CheckCircle, title: "Verified Sellers", description: "Every registered business goes through strict check verification of GST, company PAN, and operational existence." },
    { icon: Search, title: "Easy Product Discovery", description: "Faceted category navigation and simple keyword search ensure you find the right commercial supplies." },
    { icon: Zap, title: "Fast Business Inquiries", description: "One-click RFQs send your requirements instantly to sellers, receiving competitive quotes within hours." },
    { icon: Lock, title: "Secure Business Profiles", description: "Verified business profiles and clean contact channels ensure transparent communications." },
    { icon: Globe, title: "Nationwide Reach", description: "Bridge geographical boundaries. Discover manufacturers, wholesale distributors, and retail sellers across India." },
    { icon: Smartphone, title: "Mobile Friendly", description: "Optimized for mobile viewports, enabling micro-business owners to manage leads on the go." },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Hero Section */}
      <section className={`relative overflow-hidden bg-gradient-to-br ${MARKETPLACE_NAVY} pb-12 pt-10 lg:pb-16 lg:pt-14`}>
        <div className={MARKETPLACE_CONTAINER}>
          <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-6 text-center lg:text-left">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-200/90"
              >
                India&apos;s Modern B2B Platform
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl"
              >
                India&apos;s Smart B2B Marketplace for Growing Businesses
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mx-auto max-w-xl text-base leading-relaxed text-blue-100/90 lg:mx-0 lg:text-lg"
              >
                Connect buyers with verified sellers across India through a powerful, transparent, and
                easy-to-use digital marketplace.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col justify-center gap-3 sm:flex-row lg:justify-start"
              >
                {!isAuthenticated && (
                  <>
                    <button
                      onClick={() => openRegisterModal("seller")}
                      className="flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-600"
                    >
                      Join as Seller
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openRegisterModal("buyer")}
                      className="flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-white/90"
                    >
                      Join as Buyer
                      <Search className="h-4 w-4" />
                    </button>
                  </>
                )}
                <Link
                  href="/categories"
                  className="flex items-center justify-center gap-2 rounded-lg border border-white/20 px-4 py-2.5 text-sm font-medium text-blue-100/90 transition hover:bg-white/10 hover:text-white"
                >
                  Browse Categories
                </Link>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="grid w-full max-w-md grid-cols-2 gap-3 sm:gap-4 lg:shrink-0"
            >
              {[
                { label: "Products Listed", value: "10,000+" },
                { label: "Verified Sellers", value: "5,000+" },
                { label: "Categories", value: "25+" },
                { label: "Cities Active", value: "50+" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur-sm"
                >
                  <p className="text-xs font-medium text-blue-100/80">{stat.label}</p>
                  <p className="mt-1 text-2xl font-extrabold text-white">{stat.value}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Platform Overview */}
      <section className="py-16 lg:py-20">
        <div className={MARKETPLACE_CONTAINER}>
          <SectionHeading
            badge="Overview"
            title="Our Platform Core Solutions"
            subtitle="Explore how our system facilitates B2B trade across industrial categories."
          />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <motion.div
              whileHover={{ y: -2 }}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-8 transition-shadow hover:border-slate-300 hover:shadow-sm lg:row-span-2"
            >
              <div>
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                  <Search className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">Find Products</h3>
                <p className="mb-6 text-sm leading-relaxed text-slate-600">
                  Browse thousands of certified products and raw supplies across industrial, agricultural, and retail categories.
                </p>
              </div>
              <Link href="/categories" className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
                Explore Categories <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:border-slate-300 hover:shadow-sm"
            >
              <div>
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-sm font-semibold text-slate-900">Verified Sellers</h3>
                <p className="mb-4 text-sm leading-relaxed text-slate-600">
                  Partner with trusted, verified business partners with complete credentials and verified profiles.
                </p>
              </div>
              <Link href="/buyer-benefits" className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
                Buyer Protection Guide <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:border-slate-300 hover:shadow-sm"
            >
              <div>
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-sm font-semibold text-slate-900">Grow Your Business</h3>
                <p className="mb-4 text-sm leading-relaxed text-slate-600">
                  List your company catalog, expand digital market reach, and receive genuine buyer inquiries daily.
                </p>
              </div>
              {!isAuthenticated && (
                <button onClick={() => openRegisterModal("seller")} className="inline-flex items-center gap-1 text-left text-sm font-medium text-blue-600 hover:text-blue-700">
                  Become a Seller <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Choose Your Role */}
      {!isAuthenticated && (
      <section className="border-y border-slate-100 bg-white py-16 lg:py-20">
        <div className={MARKETPLACE_CONTAINER}>
          <SectionHeading
            badge="Get Started"
            title="Choose Your Path"
            subtitle="TradeNexa supports sellers, buyers, and businesses that do both — pick the role that fits you."
          />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                role: "seller" as const,
                title: "I'm a Seller",
                desc: "List products and receive buyer inquiries from across India.",
                icon: Package,
              },
              {
                role: "buyer" as const,
                title: "I'm a Buyer",
                desc: "Source verified suppliers and send RFQs without middlemen.",
                icon: Search,
              },
              {
                role: "both" as const,
                title: "I Do Both",
                desc: "Buy raw materials and sell your own catalog from one account.",
                icon: ArrowRightLeft,
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.role}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => openRegisterModal(item.role)}
                  className="group rounded-xl border border-slate-200 bg-white p-5 text-left transition-shadow hover:cursor-pointer hover:border-slate-300 hover:shadow-sm"
                >
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-[#1a2b4c]">{item.title}</h3>
                  <p className="mb-4 text-sm text-slate-500">{item.desc}</p>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all">
                    Get Started <ArrowRight className="h-4 w-4" />
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>
      )}

      {/* How It Works */}
      <section className="py-16 lg:py-20">
        <div className={MARKETPLACE_CONTAINER}>
          <SectionHeading
            badge="Process"
            title="How It Works"
            subtitle="Simplifying communication between commercial buyers and national sellers."
          />
          <ProcessStep steps={processSteps} />
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="border-t border-slate-200 bg-white py-16 lg:py-20">
        <div className={MARKETPLACE_CONTAINER}>
          <SectionHeading
            badge="Benefits"
            title="Why Choose Our B2B Platform?"
            subtitle="We provide a streamlined experience designed for small business owners and bulk procurers."
          />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-8 transition-shadow hover:border-slate-300 hover:shadow-sm lg:row-span-2"
            >
              <div>
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">{features[0].title}</h3>
                <p className="text-sm leading-relaxed text-slate-600">{features[0].description}</p>
              </div>
            </motion.div>

            {features.slice(1, 3).map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:border-slate-300 hover:shadow-sm"
                >
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-900">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-600">{f.description}</p>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.slice(3).map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:border-slate-300 hover:shadow-sm"
                >
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-900">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-600">{f.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. Call To Action */}
      <CTABanner />
    </div>
  );
}
