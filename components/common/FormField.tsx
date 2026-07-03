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
}

export function FormField({
  label,
  htmlFor,
  error,
  required,
  children,
  className = "",
  fieldKey,
}: FormFieldProps) {
  return (
    <div
      className={`space-y-1.5 ${className}`}
      data-form-field={fieldKey ?? htmlFor}
    >
      <label
        htmlFor={htmlFor}
        className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
      >
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs font-medium text-red-500">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

export const inputClassName = (hasError?: boolean) =>
  `w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:ring-2 focus:ring-primary/20 ${
    hasError
      ? "border-red-400 focus:border-red-500"
      : "border-slate-200 focus:border-primary"
  }`;
