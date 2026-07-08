"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

export interface WizardStepItem {
  key: string;
  label: string;
  shortLabel?: string;
}

interface ProductWizardStepperProps {
  steps: WizardStepItem[];
  activeIndex: number;
  maxReachedIndex: number;
  onStepClick: (index: number) => void;
}

export default function ProductWizardStepper({
  steps,
  activeIndex,
  maxReachedIndex,
  onStepClick,
}: ProductWizardStepperProps) {
  const safeActiveIndex = Math.min(Math.max(0, activeIndex), Math.max(0, steps.length - 1));
  const safeMaxReached = Math.min(Math.max(0, maxReachedIndex), Math.max(0, steps.length - 1));
  const progressPct =
    steps.length > 1
      ? Math.min(100, (safeActiveIndex / (steps.length - 1)) * 100)
      : safeActiveIndex >= 0
        ? 100
        : 0;
  const percentComplete = Math.min(
    100,
    Math.round(((safeActiveIndex + 1) / steps.length) * 100)
  );
  const current = steps[safeActiveIndex];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.05)] sm:p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
            Step {safeActiveIndex + 1} of {steps.length}
          </p>
          <h2 className="mt-0.5 text-base font-semibold text-slate-900 sm:text-lg">
            {current?.label ?? "Create product"}
          </h2>
        </div>
        <p className="text-xs text-slate-500">{percentComplete}% complete</p>
      </div>

      <div className="relative mb-5 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-blue-500"
          initial={false}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        />
      </div>

      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <ol className="flex min-w-max items-start gap-0 sm:min-w-0 sm:justify-between">
          {steps.map((step, idx) => {
            const isActive = idx === safeActiveIndex;
            const isCompleted = idx < safeMaxReached;
            const isUpcoming = idx > safeMaxReached;
            const isLast = idx === steps.length - 1;
            const canClick = !isUpcoming;

            return (
              <li
                key={step.key}
                className={`flex items-start ${isLast ? "w-auto shrink-0" : "min-w-[88px] flex-1 sm:min-w-0"}`}
              >
                <div className="flex w-full flex-col items-center">
                  <button
                    type="button"
                    disabled={isUpcoming}
                    aria-current={isActive ? "step" : undefined}
                    aria-label={`${step.label}${isCompleted ? ", completed" : isActive ? ", current" : ""}`}
                    onClick={() => canClick && onStepClick(idx)}
                    className="group flex flex-col items-center gap-2 focus-visible:outline-none disabled:cursor-not-allowed"
                  >
                    <motion.span
                      layout
                      className={[
                        "relative flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold transition-shadow duration-300 sm:h-10 sm:w-10",
                        isActive
                          ? "border-primary bg-primary text-white shadow-[0_0_0_4px_rgba(37,99,235,0.18)]"
                          : isCompleted
                            ? "border-primary bg-primary text-white"
                            : "border-slate-200 bg-white text-slate-400 group-hover:border-slate-300",
                      ].join(" ")}
                      whileHover={canClick ? { scale: 1.05 } : undefined}
                      whileTap={canClick ? { scale: 0.97 } : undefined}
                    >
                      {isCompleted && !isActive ? (
                        <Check className="h-4 w-4" strokeWidth={2.5} />
                      ) : (
                        idx + 1
                      )}
                    </motion.span>

                    <span
                      className={[
                        "max-w-[72px] text-center text-[10px] font-medium leading-tight sm:max-w-none sm:text-xs",
                        isActive ? "font-semibold text-primary" : null,
                        isCompleted && !isActive ? "text-slate-700" : null,
                        isUpcoming ? "text-slate-400" : null,
                        !isActive && !isCompleted && !isUpcoming ? "text-slate-500" : null,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <span className="sm:hidden">{step.shortLabel ?? step.label}</span>
                      <span className="hidden sm:inline">{step.label}</span>
                    </span>
                  </button>
                </div>

                {!isLast ? (
                  <div
                    className="mx-1 mt-[18px] hidden h-0.5 min-w-[12px] flex-1 rounded-full sm:mx-2 sm:block sm:min-w-[20px]"
                    aria-hidden
                  >
                    <div
                      className={`h-full rounded-full transition-colors duration-300 ${
                        idx < safeActiveIndex ? "bg-primary" : "bg-slate-200"
                      }`}
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
