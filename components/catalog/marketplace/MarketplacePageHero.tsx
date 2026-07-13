"use client";

import React from "react";
import { MARKETPLACE_CONTAINER } from "@/components/catalog/marketplace/marketplaceLayout";

export interface MarketplaceHeroStat {
  label: string;
  value: string;
}

interface MarketplacePageHeroProps {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: string;
  centered?: boolean;
  stats?: MarketplaceHeroStat[];
  breadcrumbs?: React.ReactNode;
  children?: React.ReactNode;
}

export default function MarketplacePageHero({
  eyebrow,
  title,
  subtitle,
  centered = true,
  stats,
  breadcrumbs,
  children,
}: MarketplacePageHeroProps) {
  return (
    <section className="relative overflow-hidden bg-navy pb-12 pt-10 lg:pb-16 lg:pt-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_-10%,rgb(21_101_192/0.3),transparent)]" />
      <div className={`${MARKETPLACE_CONTAINER} relative`}>
        {breadcrumbs && <div className="mb-6 hidden lg:mb-8 lg:block">{breadcrumbs}</div>}

        <div
          className={`flex flex-col gap-8 ${
            stats && !centered
              ? "lg:flex-row lg:items-end lg:justify-between"
              : centered
                ? "items-center text-center"
                : ""
          }`}
        >
          <div className={centered ? "max-w-3xl space-y-4" : "max-w-2xl space-y-3"}>
            {eyebrow && (
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                {eyebrow}
              </p>
            )}
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
              {title}
            </h1>
            {subtitle && (
              <p className="text-base leading-relaxed text-white/70 sm:text-lg">{subtitle}</p>
            )}
            {children && (
              <div className={centered ? "flex justify-center pt-2" : "pt-2"}>{children}</div>
            )}
          </div>

          {stats && stats.length > 0 && (
            <div
              className={`grid grid-cols-2 gap-3 sm:gap-4 ${
                centered ? "w-full max-w-md" : "lg:w-[420px] lg:shrink-0"
              }`}
            >
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm lg:py-5"
                >
                  <p className="text-xs font-medium text-white/55">{stat.label}</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
