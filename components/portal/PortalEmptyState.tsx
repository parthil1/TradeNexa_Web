"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface PortalEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export default function PortalEmptyState({ icon: Icon, title, description, action }: PortalEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col items-center justify-center rounded-xl border border-dashed border-portal-border bg-white px-6 py-16 text-center"
    >
      <div className="mb-4 rounded-xl bg-portal-buyer-light p-4">
        <Icon className="h-8 w-8 text-portal-buyer" />
      </div>
      <h3 className="text-lg font-semibold tracking-tight text-portal-fg">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-portal-muted">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </motion.div>
  );
}
