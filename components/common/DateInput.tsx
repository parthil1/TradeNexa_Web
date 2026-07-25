"use client";

import React from "react";
import { dateInputClassName } from "./FormField";
import { todayDatetimeLocalMin, todayInputDate } from "@/utils/dateFormat";

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
  /** When true, past dates are allowed (default: past dates blocked for date / datetime-local). */
  allowPastDates?: boolean;
}

function defaultMinForType(
  type: DateInputProps["type"],
  allowPastDates: boolean,
  min: React.InputHTMLAttributes<HTMLInputElement>["min"]
): React.InputHTMLAttributes<HTMLInputElement>["min"] {
  if (min != null || allowPastDates) return min;
  if (type === "date") return todayInputDate();
  if (type === "datetime-local") return todayDatetimeLocalMin();
  return min;
}

export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(function DateInput(
  {
    error,
    className = "",
    type = "date",
    onClick,
    lang = "en-GB",
    min,
    allowPastDates = false,
    ...rest
  },
  ref
) {
  const resolvedMin = defaultMinForType(type, allowPastDates, min);

  return (
    <input
      ref={ref}
      type={type}
      lang={lang}
      min={resolvedMin}
      className={dateInputClassName(error, className)}
      onClick={(e) => {
        openDatePicker(e.currentTarget);
        onClick?.(e);
      }}
      {...rest}
    />
  );
});
