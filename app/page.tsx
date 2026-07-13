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
  ArrowRightLeft,
  Smartphone,
  Zap,
  Globe,
  Lock,
  ShieldCheck,
  Building2,
} from "lucide-react";

import SectionHeading from "@/components/SectionHeading";
import ProcessStep from "@/components/ProcessStep";
import CTABanner from "@/components/CTABanner";
import Testimonials from "@/components/Testimonials";
import { Button } from "@/components/common/Button";
import { MARKETPLACE_CONTAINER } from "@/components/catalog/marketplace/marketplaceLayout";

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
    {
      icon: CheckCircle,
      title: "Verified Sellers",
      description:
        "Every registered business goes through verification of GST, company PAN, and operational existence.",
    },
    {
      icon: Search,
      title: "Easy Product Discovery",
      description:
        "Faceted category navigation and keyword search help you find the right commercial supplies.",
    },
    {
      icon: Zap,
      title: "Fast Business Inquiries",
      description:
        "One-click RFQs send your requirements instantly to sellers for competitive quotes.",
    },
    {
      icon: Lock,
      title: "Secure Business Profiles",
      description:
        "Verified profiles and clean contact channels keep communications transparent.",
    },
    {
      icon: Globe,
      title: "Nationwide Reach",
      description:
        "Discover manufacturers, wholesale distributors, and sellers across India.",
    },
    {
      icon: Smartphone,
      title: "Mobile Friendly",
      description:
        "Optimized for mobile so business owners can manage leads on the go.",
    },
  ];

  const trustPoints = [
    { icon: ShieldCheck, label: "GST & PAN verification" },
    { icon: Building2, label: "Business profiles" },
    { icon: Zap, label: "Direct RFQ & inquiries" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy pb-16 pt-12 lg:pb-20 lg:pt-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_-10%,rgb(21_101_192/0.35),transparent)]" />
        <div className={MARKETPLACE_CONTAINER}>
          <div className="relative flex flex-col gap-12 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
            <div className="max-w-2xl space-y-6 text-center lg:text-left">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-soft/90"
              >
                India&apos;s modern B2B platform
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.4 }}
                className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]"
              >
                Connect with verified sellers. Source smarter across India.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="mx-auto max-w-xl text-base leading-relaxed text-white/70 lg:mx-0 lg:text-lg"
              >
                TradeNexa helps buyers find trusted suppliers and sellers win quality inquiries —
                through transparent profiles, product discovery, and direct RFQs.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start"
              >
                {!isAuthenticated ? (
                  <>
                    <Button
                      size="lg"
                      onClick={() => openRegisterModal("buyer")}
                      className="min-w-[160px]"
                    >
                      Get started
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Button>
                    <Link href="/categories">
                      <Button
                        size="lg"
                        variant="secondary"
                        className="min-w-[160px] border-white/20 bg-white/10 text-white hover:border-white/30 hover:bg-white/15"
                      >
                        Browse catalog
                      </Button>
                    </Link>
                  </>
                ) : (
                  <Link href="/categories">
                    <Button size="lg">
                      Browse Categories
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Button>
                  </Link>
                )}
              </motion.div>
              <motion.ul
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25, duration: 0.4 }}
                className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 lg:justify-start"
              >
                {trustPoints.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li
                      key={item.label}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-white/60"
                    >
                      <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
                      {item.label}
                    </li>
                  );
                })}
              </motion.ul>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.4 }}
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
                  className="rounded-xl border border-white/10 bg-white/5 px-5 py-5 backdrop-blur-sm"
                >
                  <p className="text-xs font-medium text-white/55">{stat.label}</p>
                  <p className="mt-1.5 text-2xl font-semibold tracking-tight text-white">
                    {stat.value}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust strip — structure for logos / proof */}
      <section className="border-b border-border bg-white py-8">
        <div className={MARKETPLACE_CONTAINER}>
          <p className="mb-5 text-center text-xs font-semibold uppercase tracking-wider text-muted-fg">
            Built for Indian B2B trade
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {["Manufacturers", "Wholesalers", "Distributors", "Procurement teams", "SMEs"].map(
              (label) => (
                <span
                  key={label}
                  className="rounded-lg border border-border bg-muted/60 px-4 py-2 text-sm font-medium text-muted-fg"
                >
                  {label}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* Platform Overview */}
      <section className="py-16 lg:py-20">
        <div className={MARKETPLACE_CONTAINER}>
          <SectionHeading
            badge="Platform"
            title="Everything you need to trade with confidence"
            subtitle="Discover products, verify partners, and move from inquiry to deal — without middlemen."
          />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
              className="surface-card-hover flex flex-col justify-between p-8 lg:row-span-2"
            >
              <div>
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <Search className="h-6 w-6" aria-hidden />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">Find Products</h3>
                <p className="mb-6 text-sm leading-relaxed text-muted-fg">
                  Browse thousands of certified products and raw supplies across industrial,
                  agricultural, and retail categories.
                </p>
              </div>
              <Link
                href="/categories"
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition-colors duration-200 hover:text-primary-hover"
              >
                Explore Categories <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
              className="surface-card-hover flex flex-col justify-between p-6"
            >
              <div>
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <CheckCircle className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mb-2 text-base font-semibold text-foreground">Verified Sellers</h3>
                <p className="mb-4 text-sm leading-relaxed text-muted-fg">
                  Partner with businesses that have credentials and verified profiles.
                </p>
              </div>
              <Link
                href="/buyer-benefits"
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition-colors duration-200 hover:text-primary-hover"
              >
                Buyer guide <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
              className="surface-card-hover flex flex-col justify-between p-6"
            >
              <div>
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <TrendingUp className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mb-2 text-base font-semibold text-foreground">Grow Your Business</h3>
                <p className="mb-4 text-sm leading-relaxed text-muted-fg">
                  List your catalog, expand digital reach, and receive genuine buyer inquiries.
                </p>
              </div>
              {!isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => openRegisterModal("seller")}
                  className="inline-flex cursor-pointer items-center gap-1 text-left text-sm font-semibold text-primary transition-colors duration-200 hover:text-primary-hover"
                >
                  Become a Seller <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
              ) : (
                <Link
                  href="/seller-benefits"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition-colors duration-200 hover:text-primary-hover"
                >
                  Seller benefits <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Choose Your Role */}
      {!isAuthenticated && (
        <section className="border-y border-border bg-white py-16 lg:py-20">
          <div className={MARKETPLACE_CONTAINER}>
            <SectionHeading
              badge="Get Started"
              title="Choose your path"
              subtitle="TradeNexa supports sellers, buyers, and businesses that do both."
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                    type="button"
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06, duration: 0.35 }}
                    onClick={() => openRegisterModal(item.role)}
                    className="group surface-card-hover cursor-pointer p-6 text-left"
                  >
                    <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white">
                      <Icon className="h-5 w-5" aria-hidden />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-foreground">{item.title}</h3>
                    <p className="mb-4 text-sm leading-relaxed text-muted-fg">{item.desc}</p>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition-all duration-200 group-hover:gap-2">
                      Get started <ArrowRight className="h-4 w-4" aria-hidden />
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
            title="How it works"
            subtitle="A clear path from profile to deal for commercial buyers and sellers."
          />
          <ProcessStep steps={processSteps} />
          <div className="mt-10 text-center">
            <Link href="/how-it-works">
              <Button variant="outline" size="md">
                See full process
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="border-t border-border bg-white py-16 lg:py-20">
        <div className={MARKETPLACE_CONTAINER}>
          <SectionHeading
            badge="Benefits"
            title="Why businesses choose TradeNexa"
            subtitle="A streamlined experience for SMEs and bulk procurers who need trust and speed."
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04, duration: 0.35 }}
                  className="surface-card-hover p-6"
                >
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-foreground">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-fg">{f.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials — existing content */}
      <section className="border-t border-border py-16 lg:py-20">
        <div className={MARKETPLACE_CONTAINER}>
          <SectionHeading
            badge="Social proof"
            title="What our users say"
            subtitle="Feedback from sellers and buyers already trading on the platform."
          />
          <Testimonials />
        </div>
      </section>

      <CTABanner />
    </div>
  );
}
