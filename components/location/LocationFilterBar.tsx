"use client";

import React from "react";
import { X } from "lucide-react";
import StateSelect from "@/components/location/StateSelect";
import CitySelect from "@/components/location/CitySelect";

interface LocationFilterBarProps {
  idPrefix: string;
  stateId: string;
  cityId: string;
  stateLabel?: string;
  cityLabel?: string;
  onStateChange: (stateId: string, label?: string) => void;
  onCityChange: (cityId: string, label?: string) => void;
  onClear: () => void;
  onClearState?: () => void;
  onClearCity?: () => void;
  clearDisabled?: boolean;
  className?: string;
  selectClassName?: string;
  variant?: "default" | "onDark" | "toolbar" | "hero";
  /** Right-aligned results summary, e.g. "64 products found" */
  resultsLabel?: string;
}

export default function LocationFilterBar({
  idPrefix,
  stateId,
  cityId,
  stateLabel = "",
  cityLabel = "",
  onStateChange,
  onCityChange,
  onClear,
  clearDisabled = false,
  className = "",
  selectClassName,
  variant = "default",
  resultsLabel,
}: LocationFilterBarProps) {
  const compactSelectClass =
    selectClassName ??
    (variant === "toolbar" || variant === "hero"
      ? "!h-11 !w-full !max-w-[220px] !rounded-xl !border-slate-200 !bg-white !text-sm !text-slate-800 sm:!w-[200px]"
      : "!h-[3.25rem] !rounded-2xl");

  if (variant === "hero") {
    return (
      <div
        className={`rounded-2xl border border-white/20 bg-white/12 px-3 py-3 shadow-lg shadow-slate-950/10 backdrop-blur-md sm:px-4 ${className}`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <StateSelect
            id={`${idPrefix}-state`}
            value={stateId}
            selectedLabel={stateLabel}
            onChange={onStateChange}
            className={compactSelectClass}
          />
          <CitySelect
            id={`${idPrefix}-city`}
            value={cityId}
            selectedLabel={cityLabel}
            onChange={onCityChange}
            stateId={stateId}
            className={compactSelectClass}
          />
          <button
            type="button"
            onClick={onClear}
            disabled={clearDisabled}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 px-2 text-sm font-medium text-blue-100/85 underline-offset-4 transition hover:text-white hover:underline disabled:cursor-not-allowed disabled:text-blue-100/40 disabled:no-underline"
          >
            <X className="h-3.5 w-3.5" />
            Clear filters
          </button>
        </div>
      </div>
    );
  }

  if (variant === "toolbar") {
    return (
      <div
        className={`rounded-2xl border border-[#E0E6ED] bg-[#F7F8FA] px-3 py-3 sm:px-4 ${className}`}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <StateSelect
              id={`${idPrefix}-state`}
              value={stateId}
              selectedLabel={stateLabel}
              onChange={onStateChange}
              className={compactSelectClass}
            />
            <CitySelect
              id={`${idPrefix}-city`}
              value={cityId}
              selectedLabel={cityLabel}
              onChange={onCityChange}
              stateId={stateId}
              className={compactSelectClass}
            />
            <button
              type="button"
              onClick={onClear}
              disabled={clearDisabled}
              className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-[#E0E6ED] bg-white px-3 text-xs font-semibold text-[#0D1B2A] transition hover:border-[#1565C0]/30 hover:text-[#1565C0] disabled:cursor-not-allowed disabled:text-[#90A4AE] disabled:opacity-50 disabled:hover:border-[#E0E6ED] disabled:hover:text-[#90A4AE]"
            >
              <X className="h-3.5 w-3.5" />
              Clear filters
            </button>
          </div>
          {resultsLabel ? (
            <p className="shrink-0 text-sm font-medium text-[#546E7A] lg:text-right">
              {resultsLabel}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  const clearButtonClass =
    variant === "onDark"
      ? "inline-flex h-[3.25rem] shrink-0 items-center justify-center gap-1.5 rounded-2xl border border-white/20 bg-white/10 px-4 text-sm font-medium text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
      : "inline-flex h-[3.25rem] shrink-0 items-center justify-center gap-1.5 rounded-2xl border border-[#E0E6ED] bg-white px-4 text-sm font-medium text-[#546E7A] transition hover:border-[#1565C0]/40 hover:bg-[#1565C0]/5 hover:text-[#1565C0] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-[#E0E6ED] disabled:hover:bg-white disabled:hover:text-[#546E7A]";

  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-center ${className}`}>
      <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
        <StateSelect
          id={`${idPrefix}-state`}
          value={stateId}
          selectedLabel={stateLabel}
          onChange={onStateChange}
          className={compactSelectClass}
        />
        <CitySelect
          id={`${idPrefix}-city`}
          value={cityId}
          selectedLabel={cityLabel}
          onChange={onCityChange}
          stateId={stateId}
          className={compactSelectClass}
        />
      </div>
      <button
        type="button"
        onClick={onClear}
        disabled={clearDisabled}
        className={clearButtonClass}
      >
        <X className="h-4 w-4" />
        Clear filters
      </button>
    </div>
  );
}
