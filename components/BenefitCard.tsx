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
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className={`rounded-2xl border p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${
        highlighted
          ? "border-transparent bg-gradient-to-br from-[#1a3a5c] to-[#234a73] text-white hover:shadow-primary/10"
          : "border-slate-100 bg-white text-slate-850 hover:border-slate-200"
      }`}
    >
      <div
        className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${
          highlighted ? "bg-primary text-white" : "bg-primary/5 text-primary"
        }`}
      >
        <Icon className="h-6 w-6" />
      </div>
      <h3 className={`mb-2 text-xl font-bold ${highlighted ? "text-white" : "text-[#1a2b4c]"}`}>
        {title}
      </h3>
      <p className={`text-sm mb-4 leading-relaxed ${highlighted ? "text-slate-300" : "text-slate-500"}`}>
        {description}
      </p>

      {points.length > 0 && (
        <ul className="space-y-2 border-t pt-4 border-slate-200/10 mt-4">
          {points.map((point, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <span
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  highlighted ? "bg-primary text-white" : "bg-primary/10 text-primary"
                }`}
              >
                <Check className="h-3 w-3" />
              </span>
              <span className={highlighted ? "text-slate-200" : "text-slate-600"}>{point}</span>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
