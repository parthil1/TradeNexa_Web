"use client";

import React from "react";
import { MARKETPLACE_CONTAINER } from "@/components/catalog/marketplace/marketplaceLayout";
import { MARKETPLACE_NAVY } from "@/utils/marketplaceTheme";

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
    <section className={`relative bg-gradient-to-br ${MARKETPLACE_NAVY} pb-10 pt-8 lg:pb-14 lg:pt-10`}>
      <div className={`${MARKETPLACE_CONTAINER} relative`}>
        {breadcrumbs && <div className="mb-6 hidden lg:block lg:mb-8">{breadcrumbs}</div>}

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
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-200/90">
                {eyebrow}
              </p>
            )}
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              {title}
            </h1>
            {subtitle && (
              <p className="text-base leading-relaxed text-blue-100/90 sm:text-lg">{subtitle}</p>
            )}
            {children && <div className={centered ? "flex justify-center pt-2" : "pt-2"}>{children}</div>}
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
                  className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur-sm lg:py-5"
                >
                  <p className="text-xs font-medium text-blue-100/80">{stat.label}</p>
                  <p className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">{stat.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
