"use client";

import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

interface MediaStatusBarProps {
  imageCount: number;
  videoCount: number;
  maxTotal: number;
  remaining: number;
}

export default function MediaStatusBar({
  imageCount,
  videoCount,
  maxTotal,
  remaining,
}: MediaStatusBarProps) {
  const used = imageCount + videoCount;
  const pct = Math.min(100, (used / maxTotal) * 100);
  const atLimit = remaining <= 0;

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <span className="text-slate-600">
            Images:{" "}
            <span className="font-semibold text-slate-900">
              {imageCount}/{maxTotal}
            </span>
          </span>
          <span className="text-slate-600">
            Videos:{" "}
            <span className="font-semibold text-slate-900">
              {videoCount}/{maxTotal}
            </span>
          </span>
          <span className={atLimit ? "font-semibold text-amber-700" : "text-slate-600"}>
            Remaining:{" "}
            <span className="font-semibold text-slate-900">{remaining}</span>
          </span>
        </div>

        {atLimit ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
            <AlertTriangle className="h-3.5 w-3.5" />
            Maximum media reached
          </span>
        ) : null}
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200/80">
        <motion.div
          className={`h-full rounded-full ${atLimit ? "bg-amber-500" : "bg-primary"}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      <p className="mt-2 text-[11px] text-slate-400">
        Up to {maxTotal} photos + videos combined. Thumbnail is separate.
      </p>
    </div>
  );
}
