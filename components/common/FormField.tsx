"use client";

import React from "react";
import { AlertCircle } from "lucide-react";

interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  /** Used for scroll-to-error targeting (`data-form-field`) */
  fieldKey?: string;
  hint?: string;
}

export function FormField({
  label,
  htmlFor,
  error,
  required,
  children,
  className = "",
  fieldKey,
  hint,
}: FormFieldProps) {
  return (
    <div
      className={`space-y-2 ${className}`}
      data-form-field={fieldKey ?? htmlFor}
    >
      <label
        htmlFor={htmlFor}
        className="block text-xs font-semibold uppercase tracking-wider text-slate-500"
      >
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-slate-400">{hint}</p>
      )}
      {error ? (
        <p
          role="alert"
          className="flex items-center gap-1.5 text-xs font-medium text-red-600"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const inputClassName = (hasError?: boolean) =>
  `h-12 w-full rounded-xl border bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 ${
    hasError
      ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
      : "border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10"
  }`;
