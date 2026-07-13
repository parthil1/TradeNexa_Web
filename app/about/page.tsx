"use client";

import React from "react";
import Link from "next/link";
import SectionHeading from "@/components/SectionHeading";
import CTABanner from "@/components/CTABanner";
import MarketplacePageHero from "@/components/catalog/marketplace/MarketplacePageHero";
import { MARKETPLACE_CONTAINER } from "@/components/catalog/marketplace/marketplaceLayout";
import { useApp } from "@/app/context/AppContext";
import { useAuth } from "@/hooks/useAuth";
import {
  Shield,
  Target,
  Compass,
  Heart,
  Store,
  ShoppingCart,
  ArrowLeftRight,
  Users,
  Package,
  MapPin,
  Handshake,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";

export default function About() {
  const { openRegisterModal } = useApp();
  const { isAuthenticated } = useAuth();

  const values = [
    {
      title: "Trust & Transparency",
      desc: "Verifying seller profiles and maintaining clear communication channels to foster reliable business deals.",
      icon: Shield,
    },
    {
      title: "Empowerment",
      desc: "Equipping local sellers with digital catalog management and lead generation systems to scale nationwide.",
      icon: Target,
    },
    {
      title: "Innovation",
      desc: "Continuously improving search queries, category sorting, and match speeds to simplify B2B trade.",
      icon: Compass,
    },
    {
      title: "Customer Centricity",
      desc: "Prioritizing ease of use for traditional business owners who might not be technically advanced.",
      icon: Heart,
    },
  ];

  const impactStats = [
    { label: "Verified Sellers", value: "5,000+", icon: Store, color: "text-primary bg-primary-soft" },
    { label: "Products Listed", value: "10,000+", icon: Package, color: "text-navy-mid bg-muted" },
    { label: "Cities Connected", value: "50+", icon: MapPin, color: "text-muted-fg bg-muted" },
    { label: "Successful Matches", value: "25,000+", icon: Handshake, color: "text-primary bg-primary-soft" },
  ];

  const roleCards = [
    {
      role: "seller" as const,
      title: "For Sellers",
      icon: Store,
      description:
        "Manufacturers, distributors, and wholesalers list catalogs, receive RFQs, and grow reach beyond their local market.",
      features: ["Free business profile", "Product catalog listing", "Direct buyer inquiries", "Nationwide visibility"],
      cta: "Register as Seller",
      accent: "from-navy-mid to-navy",
    },
    {
      role: "buyer" as const,
      title: "For Buyers",
      icon: ShoppingCart,
      description:
        "Retailers, contractors, and procurement teams discover verified suppliers and compare quotes without middlemen.",
      features: ["Verified supplier search", "One-click RFQ forms", "Direct seller contact", "No platform commission"],
      cta: "Register as Buyer",
      accent: "from-navy to-navy-mid",
    },
    {
      role: "both" as const,
      title: "For Both",
      icon: ArrowLeftRight,
      description:
        "Many businesses buy raw materials and sell finished goods. One account handles both sides of your trade.",
      features: ["Dual buyer & seller dashboard", "Unified business profile", "Cross-category sourcing", "Flexible role switching"],
      cta: "Register for Both",
      accent: "from-primary to-navy-mid",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketplacePageHero
        eyebrow="About Us"
        title={
          <>
            Our Mission is to <span className="text-primary-soft">Digitally Empower Businesses</span>
          </>
        }
        subtitle="We build marketplace tools that let sellers, buyers, and dual-role businesses connect instantly, transparently, and nationwide."
        centered={false}
      />

      <section className="py-12 lg:py-16">
        <div className={MARKETPLACE_CONTAINER}>
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-7">
              <h2 className="text-3xl font-extrabold tracking-tight text-navy">Who We Are</h2>
              <p className="text-sm leading-relaxed text-muted-fg">
                We are a modern team dedicated to rebuilding B2B marketplace tools. Traditional commerce directories
                are often slow and cluttered. We provide a sleek, search-optimized platform designed to help
                manufacturers, distributors, bulk buyers, and businesses that do both connect with confidence.
              </p>
              <div className="grid grid-cols-1 gap-6 pt-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
                  <h3 className="mb-2 flex items-center gap-2 font-bold text-navy">
                    <Target className="h-5 w-5 text-primary" />
                    Our Mission
                  </h3>
                  <p className="text-xs leading-relaxed text-muted-fg">
                    To digitize trading and communication for over 10 million small and medium enterprises across
                    India, converting local catalog setups into high-volume national sales pipelines.
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
                  <h3 className="mb-2 flex items-center gap-2 font-bold text-navy">
                    <Compass className="h-5 w-5 text-primary" />
                    Our Vision
                  </h3>
                  <p className="text-xs leading-relaxed text-muted-fg">
                    To become the most user-friendly and trusted marketplace where B2B negotiations and supply
                    catalog searches resolve within minutes rather than weeks.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center lg:col-span-5">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="w-full max-w-md rounded-3xl border border-border bg-gradient-to-br from-muted to-card p-6 shadow-elevated"
              >
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-navy">Platform at a Glance</h4>
                    <p className="text-xs text-muted-fg">Real impact across India&apos;s B2B ecosystem</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {impactStats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.08 }}
                        className="rounded-xl border border-border bg-card p-4 shadow-card"
                      >
                        <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ${stat.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <p className="text-lg font-extrabold text-navy">{stat.value}</p>
                        <p className="text-[11px] font-medium text-muted-fg">{stat.label}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-muted py-16">
        <div className={MARKETPLACE_CONTAINER}>
          <SectionHeading
            badge="Ethos"
            title="Our Values"
            subtitle="The fundamental standards guiding our development, platform policies, and support systems."
          />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-xl border border-border bg-card p-8 transition-shadow hover:border-border hover:shadow-card lg:row-span-2"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-navy">{values[0].title}</h3>
              <p className="text-sm leading-relaxed text-muted-fg">{values[0].desc}</p>
            </motion.div>

            {values.slice(1, 3).map((v, i) => {
              const Icon = v.icon;
              return (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-border bg-card p-5 transition-shadow hover:border-border hover:shadow-card"
                >
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 text-sm font-semibold text-navy">{v.title}</h3>
                  <p className="text-xs leading-relaxed text-muted-fg">{v.desc}</p>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-4">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-xl border border-border bg-card p-5 transition-shadow hover:border-border hover:shadow-card"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Heart className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-sm font-semibold text-navy">{values[3].title}</h3>
              <p className="text-xs leading-relaxed text-muted-fg">{values[3].desc}</p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="bg-card py-16">
        <div className={MARKETPLACE_CONTAINER}>
          <SectionHeading
            badge="Ecosystem"
            title="Built For Every Business"
            subtitle="Whether you sell, buy, or do both — TradeNexa adapts to how your business actually operates."
          />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {(() => {
              const card = roleCards[0];
              const Icon = card.icon;
              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="group flex flex-col rounded-xl border border-border bg-card p-8 transition-shadow hover:border-border hover:shadow-card lg:row-span-2"
                >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-navy">{card.title}</h3>
                  <p className="mb-5 text-sm leading-relaxed text-muted-fg">{card.description}</p>
                  <ul className="mb-6 flex-1 space-y-2">
                    {card.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-xs text-muted-fg">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {!isAuthenticated && (
                    <button
                      onClick={() => openRegisterModal(card.role)}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition hover:text-primary-hover"
                    >
                      {card.cta}
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </button>
                  )}
                </motion.div>
              );
            })()}

            {roleCards.slice(1).map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.role}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-shadow hover:border-border hover:shadow-card"
                >
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 text-sm font-semibold text-navy">{card.title}</h3>
                  <p className="mb-5 text-sm leading-relaxed text-muted-fg">{card.description}</p>
                  <ul className="mb-6 flex-1 space-y-2">
                    {card.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-xs text-muted-fg">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {!isAuthenticated && (
                    <button
                      onClick={() => openRegisterModal(card.role)}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition hover:text-primary-hover"
                    >
                      {card.cta}
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-fg transition hover:border-border hover:shadow-card"
            >
              See how each role works
              <ArrowRight className="h-4 w-4 text-primary" />
            </Link>
          </div>
        </div>
      </section>

      <CTABanner />
    </div>
  );
}
