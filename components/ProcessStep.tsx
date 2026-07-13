"use client";

import React from "react";
import { LucideIcon, ArrowRight, ArrowDown } from "lucide-react";
import { motion } from "framer-motion";

interface Step {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

interface ProcessStepProps {
  steps: Step[];
}

export default function ProcessStep({ steps }: ProcessStepProps) {
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-4 relative">
      {steps.map((step, index) => {
        const Icon = step.icon;
        return (
          <div key={index} className="flex flex-col items-center text-center relative group">
            {/* Step Icon & Number */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full border-2 border-border bg-muted text-foreground shadow-sm transition-all duration-200 group-hover:border-primary group-hover:bg-primary group-hover:text-white group-hover:shadow-md"
            >
              <Icon className="h-8 w-8" />
              <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-xs font-bold shadow-sm group-hover:bg-white group-hover:text-primary transition-colors">
                {step.number}
              </span>
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
              className="mt-6"
            >
              <h3 className="mb-2 text-lg font-semibold text-foreground transition-colors duration-200 group-hover:text-primary">
                {step.title}
              </h3>
              <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-fg">
                {step.description}
              </p>
            </motion.div>

            {/* Connecting Arrow for Desktop */}
            {index < steps.length - 1 && (
              <div className="absolute left-[70%] top-10 z-0 hidden w-[60%] text-border md:block">
                <ArrowRight className="h-6 w-6 mx-auto animate-pulse" />
              </div>
            )}

            {/* Connecting Arrow for Mobile */}
            {index < steps.length - 1 && (
              <div className="mt-6 text-border md:hidden">
                <ArrowDown className="h-6 w-6 mx-auto animate-pulse" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
