"use client";

import React from "react";
import { Check, LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface BenefitCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  points?: string[];
  delay?: number;
  highlighted?: boolean;
  badge?: string;
}

export default function BenefitCard({
  icon: Icon,
  title,
  description,
  points = [],
  delay = 0,
  highlighted = false,
  badge,
}: BenefitCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -2 }}
      className={`relative rounded-xl border p-5 transition-shadow duration-200 hover:shadow-sm hover:border-slate-300 ${
        highlighted
          ? "border-blue-500 bg-white shadow-sm"
          : "border-slate-200 bg-white hover:cursor-pointer"
      }`}
    >
      {badge ? (
        <span className="absolute right-4 top-4 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-600">
          {badge}
        </span>
      ) : null}
      <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <h3 className="mb-2 text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mb-4 text-sm leading-relaxed text-slate-600">{description}</p>

      {points.length > 0 && (
        <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4">
          {points.map((point, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-500">
                <Check className="h-2.5 w-2.5" />
              </span>
              <span className="text-slate-600">{point}</span>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
