"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, MessageSquare, Store, ShoppingCart, ArrowLeftRight } from "lucide-react";
import { useApp } from "@/app/context/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Button } from "@/components/common/Button";

export default function CTABanner() {
  const { openRegisterModal } = useApp();
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) return null;

  return (
    <section className="relative mx-4 my-16 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-16 sm:mx-8 sm:py-20 lg:mx-12">
      <div className="pointer-events-none absolute -right-16 -top-16 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-5xl px-6 text-center lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="text-3xl font-semibold tracking-tight text-white sm:text-4xl"
        >
          Ready to grow your business?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="mx-auto mt-4 max-w-xl text-lg text-slate-300"
        >
          Join thousands of sellers, buyers, and dual-role businesses expanding their reach through TradeNexa.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap"
        >
          <Button onClick={() => openRegisterModal("seller")} size="lg">
            <Store className="h-4 w-4" />
            Join as Seller
          </Button>
          <Button
            onClick={() => openRegisterModal("buyer")}
            variant="secondary"
            size="lg"
            className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:border-white/30"
          >
            <ShoppingCart className="h-4 w-4" />
            Join as Buyer
          </Button>
          <Button
            onClick={() => openRegisterModal("both")}
            variant="secondary"
            size="lg"
            className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:border-white/30"
          >
            <ArrowLeftRight className="h-4 w-4" />
            Join as Both
          </Button>
          <Link href="/contact">
            <Button
              variant="ghost"
              size="lg"
              className="text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <MessageSquare className="h-4 w-4" />
              Contact Us
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
