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
      ? Math.min(100, (safeMaxReached / (steps.length - 1)) * 100)
      : safeMaxReached >= 0
        ? 100
        : 0;
  const percentComplete = Math.min(
    100,
    Math.round(((safeMaxReached + 1) / steps.length) * 100)
  );
  const current = steps[safeActiveIndex];

  return (
    <div className="surface-card overflow-hidden p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Step {safeActiveIndex + 1} of {steps.length}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-foreground sm:text-xl">
            {current?.label ?? "Create product"}
          </h2>
        </div>
        <p className="text-sm font-medium text-muted-fg">{percentComplete}% complete</p>
      </div>

      <div className="relative mb-6 h-2 overflow-hidden rounded-full bg-border">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-primary"
          initial={false}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        />
      </div>

      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <ol className="flex min-w-max items-start gap-0 sm:min-w-0 sm:justify-between">
          {steps.map((step, idx) => {
            const isActive = idx === safeActiveIndex;
            const isCompleted = idx <= safeMaxReached && !isActive;
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
                    className="group flex cursor-pointer flex-col items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed"
                  >
                    <motion.span
                      layout
                      className={[
                        "relative flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-300 sm:h-11 sm:w-11",
                        isActive
                          ? "border-primary bg-primary text-white shadow-[0_0_0_4px_rgba(21,101,192,0.2)]"
                          : isCompleted
                            ? "border-primary bg-primary text-white"
                            : "border-border bg-white text-muted-placeholder group-hover:border-primary/50",
                      ].join(" ")}
                      whileHover={canClick ? { scale: 1.05 } : undefined}
                      whileTap={canClick ? { scale: 0.97 } : undefined}
                    >
                      {isCompleted && !isActive ? (
                        <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                      ) : (
                        idx + 1
                      )}
                    </motion.span>

                    <span
                      className={[
                        "max-w-[72px] text-center text-xs font-medium leading-tight sm:max-w-none sm:text-sm",
                        isActive ? "font-semibold text-primary" : null,
                        isCompleted && !isActive ? "text-foreground" : null,
                        isUpcoming ? "text-muted-placeholder" : null,
                        !isActive && !isCompleted && !isUpcoming ? "text-muted-fg" : null,
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
                        idx < safeMaxReached ? "bg-primary" : "bg-border"
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
