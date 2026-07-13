"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  delay?: number;
}

export default function FeatureCard({ icon: Icon, title, description, delay = 0 }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4 }}
      className="group surface-card-hover rounded-xl p-6"
    >
      <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/8 text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-white">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <h3 className="mb-2 text-base font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-muted-fg">
        {description}
      </p>
    </motion.div>
  );
}
