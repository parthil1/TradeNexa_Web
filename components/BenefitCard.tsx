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
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay }}
      whileHover={{ y: -2 }}
      className={`relative p-6 transition-all duration-200 ${
        highlighted
          ? "rounded-xl border-2 border-primary bg-white shadow-[var(--shadow-card)]"
          : "surface-card-hover"
      }`}
    >
      {badge ? (
        <span className="absolute right-4 top-4 rounded-full bg-primary-soft px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
          {badge}
        </span>
      ) : null}
      <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </div>
      <h3 className="mb-2 text-base font-semibold text-foreground">{title}</h3>
      <p className="mb-4 text-sm leading-relaxed text-muted-fg">{description}</p>

      {points.length > 0 && (
        <ul className="mt-4 space-y-2.5 border-t border-border pt-4">
          {points.map((point, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                <Check className="h-2.5 w-2.5" aria-hidden />
              </span>
              <span className="text-muted-fg">{point}</span>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
