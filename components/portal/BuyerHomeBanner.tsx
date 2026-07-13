"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { ApiBanner } from "@/types/banner";
import {
  hasBannerRedirect,
  resolveBannerHref,
  resolveBannerImageUrl,
  sortBannersByPriority,
} from "@/utils/bannerHelpers";

interface BuyerHomeBannerProps {
  banners: ApiBanner[];
}

function BannerContent({
  banner,
  imageUrl,
  href,
}: {
  banner: ApiBanner;
  imageUrl: string | null;
  href: string | null;
}) {
  const showExplore = hasBannerRedirect(banner);
  const inner = (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={banner.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="absolute inset-0"
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={banner.title}
              fill
              className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]"
              unoptimized
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-navy-mid" />
          )}
        </motion.div>
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy/75 via-navy/25 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-3 sm:p-4">
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-white/75 sm:text-[10px]">
            TradeNexa B2B
          </p>
          <h3 className="mt-0.5 truncate text-base font-bold leading-tight text-white sm:text-lg">
            {banner.title}
          </h3>
        </div>
        {showExplore && href ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-semibold text-primary shadow-sm transition group-hover:bg-white sm:px-3.5 sm:py-2 sm:text-sm">
            Explore
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        ) : null}
      </div>
    </>
  );

  const className = "group relative block h-[148px] overflow-hidden sm:h-[168px] md:h-[188px]";

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }

  return <div className={className}>{inner}</div>;
}

export default function BuyerHomeBanner({ banners }: BuyerHomeBannerProps) {
  const sortedBanners = useMemo(() => sortBannersByPriority(banners), [banners]);
  const [index, setIndex] = useState(0);
  const active = sortedBanners[index];

  useEffect(() => {
    setIndex(0);
  }, [sortedBanners]);

  useEffect(() => {
    if (sortedBanners.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % sortedBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [sortedBanners.length]);

  if (!active) return null;

  const imageUrl = resolveBannerImageUrl(active);
  const href = resolveBannerHref(active);

  return (
    <div className="relative mb-5 sm:mb-6">
      <motion.div
        layout
        className="relative overflow-hidden rounded-xl border border-border bg-muted shadow-sm sm:rounded-2xl"
      >
        <BannerContent banner={active} imageUrl={imageUrl} href={href} />
      </motion.div>

      {sortedBanners.length > 1 ? (
        <div className="mt-2.5 flex items-center justify-center gap-1.5">
          {sortedBanners.map((banner, i) => (
            <button
              key={banner.id}
              type="button"
              onClick={() => setIndex(i)}
              className={`rounded-full transition-all ${
                i === index
                  ? "h-1.5 w-5 bg-primary"
                  : "h-1.5 w-1.5 bg-muted-fg hover:bg-foreground"
              }`}
              aria-label={`Show banner: ${banner.title}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
