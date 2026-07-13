"use client";

import React from "react";
import { motion } from "framer-motion";
import { Package, RefreshCw } from "lucide-react";
import { Button } from "@/components/common/Button";

interface CatalogEmptyStateProps {
  title: string;
  description: string;
  onReset?: () => void;
  resetLabel?: string;
}

export default function CatalogEmptyState({
  title,
  description,
  onReset,
  resetLabel = "Reset filters",
}: CatalogEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto max-w-md py-20 text-center"
    >
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted ring-1 ring-border">
        <Package className="h-7 w-7 text-muted-fg" />
      </div>
      <h3 className="text-lg font-semibold tracking-tight text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-fg">{description}</p>
      {onReset && (
        <div className="mt-6">
          <Button variant="outline" onClick={onReset}>
            <RefreshCw className="h-4 w-4" />
            {resetLabel}
          </Button>
        </div>
      )}
    </motion.div>
  );
}
