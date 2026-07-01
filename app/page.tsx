"use client";

import React from "react";
import Link from "next/link";
import { useApp } from "@/app/context/AppContext";
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
  Tv,
  Wrench,
  Sprout,
  Shirt,
  HardHat,
  FlaskConical,
  Armchair,
  Box
} from "lucide-react";

import SectionHeading from "@/components/SectionHeading";
import FeatureCard from "@/components/FeatureCard";
import CategoryCard from "@/components/CategoryCard";
import ProcessStep from "@/components/ProcessStep";
import Counter from "@/components/Counter";
import Testimonials from "@/components/Testimonials";
import CTABanner from "@/components/CTABanner";
import TrendingProducts from "@/components/TrendingProducts";

export default function Home() {
  const { openRegisterModal } = useApp();

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

  const categories = [
    { title: "Electronics", description: "Consumer electronics, wiring, semiconductors & components.", count: 2400, icon: Tv },
    { title: "Machinery", description: "Industrial manufacturing plants, heavy machinery & spare tools.", count: 1850, icon: Wrench },
    { title: "Agriculture", description: "Fresh crops, organic fertilizers, grains & farming machinery.", count: 1200, icon: Sprout },
    { title: "Fashion", description: "Textiles, bulk apparel, yarn, garments & accessories.", count: 3100, icon: Shirt },
    { title: "Construction", description: "Cement, steel bars, aggregates & brick manufacturing items.", count: 950, icon: HardHat },
    { title: "Chemicals", description: "Industrial chemical solutions, dyes, polymers & minerals.", count: 1500, icon: FlaskConical },
    { title: "Furniture", description: "Office desks, commercial chairs, steel racks & wood fittings.", count: 800, icon: Armchair },
    { title: "Packaging", description: "Corrugated boxes, food containers, wrapping films & tapes.", count: 1150, icon: Box },
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
    <div className="flex flex-col min-h-screen">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/30 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold text-primary"
              >
                <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                India's Modern B2B Platform
              </motion.span>
              <motion.h4
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl"
              >
                India's Smart B2B Marketplace for <span className="text-primary">Growing Businesses</span>
              </motion.h4>
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mx-auto lg:mx-0 max-w-2xl text-lg text-slate-500 leading-relaxed"
              >
                Connect Buyers with Verified Sellers across India through a powerful, transparent, and easy-to-use digital marketplace.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col justify-center gap-3 sm:flex-row lg:justify-start"
              >
                <button
                  onClick={() => openRegisterModal("seller")}
                  className="flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-primary/15 transition-all hover:bg-primary-hover hover:shadow-primary/25"
                >
                  Join as Seller
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => openRegisterModal("buyer")}
                  className="flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-8 py-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Join as Buyer
                  <Search className="h-4 w-4 text-primary" />
                </button>
                <Link
                  href="/categories"
                  className="flex items-center justify-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-8 py-4 text-sm font-semibold text-primary transition hover:bg-primary/10"
                >
                  Browse Products
                </Link>
              </motion.div>
            </div>

            {/* Hero Right Graphic */}
            <div className="lg:col-span-5 flex justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="relative w-full max-w-md aspect-square bg-slate-100 rounded-3xl overflow-hidden shadow-inner border border-slate-100 flex items-center justify-center p-8 bg-gradient-to-br from-blue-50/50 to-white"
              >
                {/* SVG Visual Representation of Marketplace */}
                <svg viewBox="0 0 400 400" className="w-full h-full text-slate-800">
                  <defs>
                    <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#2563eb" />
                      <stop offset="100%" stopColor="#1d4ed8" />
                    </linearGradient>
                  </defs>

                  {/* Central Platform Orb */}
                  <circle cx="200" cy="200" r="70" fill="url(#blueGrad)" opacity="0.1" />
                  <circle cx="200" cy="200" r="50" fill="url(#blueGrad)" opacity="0.8" />
                  <path d="M185,185 h30 v30 h-30 z" fill="#ffffff" opacity="0.9" />
                  <path d="M200,175 l20,20 h-40 z" fill="#ffffff" />

                  {/* Connecting Lines */}
                  <line x1="80" y1="120" x2="150" y2="170" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4" />
                  <line x1="320" y1="120" x2="250" y2="170" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4" />
                  <line x1="80" y1="280" x2="150" y2="230" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4" />
                  <line x1="320" y1="280" x2="250" y2="230" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4" />

                  {/* Sellers Group */}
                  <g transform="translate(60, 100)">
                    <circle cx="20" cy="20" r="28" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
                    <rect x="10" y="10" width="20" height="20" rx="3" fill="#2563eb" />
                    <text x="20" y="48" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#475569">Sellers</text>
                  </g>

                  {/* Products Group */}
                  <g transform="translate(300, 100)">
                    <circle cx="20" cy="20" r="28" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
                    <path d="M12,12 h16 v16 h-16 z" fill="#10b981" />
                    <text x="20" y="48" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#475569">Products</text>
                  </g>

                  {/* Buyers Group */}
                  <g transform="translate(60, 260)">
                    <circle cx="20" cy="20" r="28" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
                    <circle cx="20" cy="18" r="8" fill="#f59e0b" />
                    <path d="M10,30 q10,-8 20,0" stroke="#f59e0b" strokeWidth="2" fill="none" />
                    <text x="20" y="48" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#475569">Buyers</text>
                  </g>

                  {/* Connections Group */}
                  <g transform="translate(300, 260)">
                    <circle cx="20" cy="20" r="28" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
                    <path d="M10,20 h20 M20,10 v20" stroke="#6366f1" strokeWidth="3" />
                    <text x="20" y="48" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#475569">Inquiries</text>
                  </g>
                </svg>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Our Platform (3 Cards) */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="Overview"
            title="Our Platform Core Solutions"
            subtitle="Explore how our system facilitates B2B trade across industrial categories."
          />
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Card 1 */}
            <motion.div
              whileHover={{ y: -5 }}
              className="rounded-2xl border border-slate-100 bg-slate-50 p-8 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 text-white">
                  <Search className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Find Products</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-6">
                  Browse thousands of certified products and raw supplies across industrial, agricultural, and retail categories.
                </p>
              </div>
              <Link href="/categories" className="text-sm font-semibold text-primary hover:text-primary-hover flex items-center gap-1">
                Explore Categories <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              whileHover={{ y: -5 }}
              className="rounded-2xl border border-slate-100 bg-slate-50 p-8 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-white">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Verified Sellers</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-6">
                  Partner with trusted, verified business partners with complete credentials and verified profiles.
                </p>
              </div>
              <Link href="/buyer-benefits" className="text-sm font-semibold text-primary hover:text-primary-hover flex items-center gap-1">
                Buyer Protection Guide <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>

            {/* Card 3 */}
            <motion.div
              whileHover={{ y: -5 }}
              className="rounded-2xl border border-slate-100 bg-slate-50 p-8 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500 text-white">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Grow Your Business</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-6">
                  List your company catalog, expand digital market reach, and receive genuine buyer inquiries daily.
                </p>
              </div>
              <button onClick={() => openRegisterModal("seller")} className="text-sm font-semibold text-primary hover:text-primary-hover text-left flex items-center gap-1">
                Become a Seller <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2.5 Choose Your Role */}
      <section className="border-y border-slate-100 bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
                color: "bg-primary",
              },
              {
                role: "buyer" as const,
                title: "I'm a Buyer",
                desc: "Source verified suppliers and send RFQs without middlemen.",
                icon: Search,
                color: "bg-emerald-500",
              },
              {
                role: "both" as const,
                title: "I Do Both",
                desc: "Buy raw materials and sell your own catalog from one account.",
                icon: ArrowRightLeft,
                color: "bg-indigo-500",
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
                  className="group rounded-2xl border border-slate-100 bg-white p-6 text-left shadow-sm transition hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${item.color} text-white`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-slate-900">{item.title}</h3>
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

      {/* 3. How It Works Section */}
      <section className="py-16 bg-slate-50 border-y border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="Process"
            title="How It Works"
            subtitle="Simplifying communication between commercial buyers and national sellers."
          />
          <ProcessStep steps={processSteps} />
        </div>
      </section>

      {/* 4. Industries Section */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
            <div className="text-center sm:text-left">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Featured Industries</h2>
              <p className="mt-2 text-slate-500 text-sm">Discover products across major B2B manufacturing segments.</p>
            </div>
            <Link
              href="/categories"
              className="rounded-full bg-slate-50 px-5 py-2.5 text-sm font-semibold text-primary hover:bg-slate-100 transition"
            >
              All Categories →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((c, i) => (
              <CategoryCard
                key={i}
                icon={c.icon}
                title={c.title}
                description={c.description}
                productCount={c.count}
                delay={i * 0.05}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 4.5 Trending Products */}
      <TrendingProducts />

      {/* 5. Why Choose Us Section */}
      <section className="py-16 bg-slate-50 border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="Benefits"
            title="Why Choose Our B2B Platform?"
            subtitle="We provide a streamlined experience designed for small business owners and bulk procurers."
          />
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <FeatureCard
                key={i}
                icon={f.icon}
                title={f.title}
                description={f.description}
                delay={i * 0.05}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 6. Statistics Section */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="Scale"
            title="Our Platform in Numbers"
            subtitle="Empowering B2B marketplace interactions across the Indian subcontinent."
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Counter value={10000} title="Products" suffix="+" />
            <Counter value={5000} title="Verified Sellers" suffix="+" />
            <Counter value={25} title="Categories" suffix="+" />
            <Counter value={50} title="Cities Active" suffix="+" />
          </div>
        </div>
      </section>
      {/* 8. Call To Action */}
      <CTABanner />
    </div>
  );
}
