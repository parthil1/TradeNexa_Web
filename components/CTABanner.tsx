"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, MessageSquare, Store, ShoppingCart, ArrowLeftRight } from "lucide-react";
import { useApp } from "@/app/context/AppContext";
import { motion } from "framer-motion";
import { MARKETPLACE_NAVY } from "@/utils/marketplaceTheme";

export default function CTABanner() {
  const { openRegisterModal } = useApp();

  return (
    <section className={`relative mx-4 my-12 overflow-hidden rounded-3xl bg-gradient-to-br ${MARKETPLACE_NAVY} py-16 sm:mx-8 sm:py-20 lg:mx-12`}>
      <div className="absolute -right-12 -top-12 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-12 -left-12 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-5xl px-6 text-center lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
        >
          Ready to Grow Your Business?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto mt-4 max-w-xl text-lg text-blue-100/90"
        >
          Join thousands of sellers, buyers, and dual-role businesses expanding their reach through TradeNexa.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap"
        >
          <button
            onClick={() => openRegisterModal("seller")}
            className="flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover"
          >
            <Store className="h-4 w-4" />
            Join as Seller
          </button>
          <button
            onClick={() => openRegisterModal("buyer")}
            className="flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
          >
            <ShoppingCart className="h-4 w-4 text-blue-200" />
            Join as Buyer
          </button>
          <button
            onClick={() => openRegisterModal("both")}
            className="flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
          >
            <ArrowLeftRight className="h-4 w-4 text-blue-200" />
            Join as Both
          </button>
          <Link
            href="/contact"
            className="flex items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3.5 text-sm font-semibold text-blue-100/90 transition hover:bg-white/10 hover:text-white"
          >
            <MessageSquare className="h-4 w-4 text-primary" />
            Contact Us
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
