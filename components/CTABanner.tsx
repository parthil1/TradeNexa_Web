"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Store, Search } from "lucide-react";
import { useApp } from "@/app/context/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Button } from "@/components/common/Button";

export default function CTABanner() {
  const { openRegisterModal } = useApp();
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) return null;

  return (
    <section className="relative mx-4 my-16 overflow-hidden rounded-2xl bg-navy py-14 sm:mx-8 sm:py-16 lg:mx-auto lg:max-w-7xl lg:px-0">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgb(21_101_192/0.25),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgb(255_109_0/0.08),transparent_50%)]" />

      <div className="relative mx-auto max-w-3xl px-6 text-center sm:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-3xl font-semibold tracking-tight text-white sm:text-4xl"
        >
          Ready to grow your business?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg"
        >
          Join sellers and buyers expanding their reach through TradeNexa — verified profiles,
          direct inquiries, and nationwide discovery.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button onClick={() => openRegisterModal("seller")} size="lg">
            <Store className="h-4 w-4" aria-hidden />
            Join as Seller
          </Button>
          <Button
            onClick={() => openRegisterModal("buyer")}
            variant="secondary"
            size="lg"
            className="border-white/20 bg-white/10 text-white hover:border-white/30 hover:bg-white/20"
          >
            <Search className="h-4 w-4" aria-hidden />
            Join as Buyer
          </Button>
          <Link href="/how-it-works">
            <Button
              variant="ghost"
              size="lg"
              className="text-white/70 hover:bg-white/10 hover:text-white"
            >
              How it works
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
