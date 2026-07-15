"use client";

import React from "react";
import { dateInputClassName } from "./FormField";

export function openDatePicker(input: HTMLInputElement | null) {
  if (!input || input.disabled) return;
  if (typeof input.showPicker === "function") {
    try {
      input.showPicker();
      return;
    } catch {
      // showPicker can throw if not triggered by user gesture in some browsers
    }
  }
  input.focus();
}

export interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  error?: boolean;
  type?: "date" | "datetime-local" | "month" | "time";
}

export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(function DateInput(
  { error, className = "", type = "date", onClick, lang = "en-GB", ...rest },
  ref
) {
  return (
    <input
      ref={ref}
      type={type}
      lang={lang}
      className={dateInputClassName(error, className)}
      onClick={(e) => {
        openDatePicker(e.currentTarget);
        onClick?.(e);
      }}
      {...rest}
    />
  );
});
