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
}

export default function BenefitCard({
  icon: Icon,
  title,
  description,
  points = [],
  delay = 0,
  highlighted = false,
}: BenefitCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4 }}
      className={`rounded-xl p-6 transition-all duration-200 ${
        highlighted
          ? "bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-[0_8px_32px_-8px_rgba(15,23,42,0.3)]"
          : "surface-card-hover"
      }`}
    >
      <div
        className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${
          highlighted ? "bg-white/10 text-white" : "bg-primary/8 text-primary"
        }`}
      >
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <h3 className={`mb-2 text-lg font-semibold tracking-tight ${highlighted ? "text-white" : "text-slate-900"}`}>
        {title}
      </h3>
      <p className={`mb-4 text-sm leading-relaxed ${highlighted ? "text-slate-300" : "text-slate-500"}`}>
        {description}
      </p>

      {points.length > 0 && (
        <ul className={`mt-4 space-y-2 border-t pt-4 ${highlighted ? "border-white/10" : "border-slate-100"}`}>
          {points.map((point, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <span
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                  highlighted ? "bg-primary text-white" : "bg-primary/10 text-primary"
                }`}
              >
                <Check className="h-2.5 w-2.5" />
              </span>
              <span className={highlighted ? "text-slate-200" : "text-slate-600"}>{point}</span>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
