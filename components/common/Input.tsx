import React from "react";
import { dateInputClassName, inputClassName } from "./FormField";
import { openDatePicker } from "./DateInput";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label?: string;
  error?: boolean;
  className?: string;
  icon?: React.ElementType;
}

export const Input: React.FC<InputProps> = ({
  id,
  label,
  error,
  icon: Icon,
  className = "",
  type,
  onClick,
  ...rest
}) => {
  const isPickerInput = type === "date" || type === "datetime-local" || type === "month" || type === "time";
  const inputStyles = `${isPickerInput ? dateInputClassName(error) : inputClassName(error)} ${Icon ? "pl-11" : ""} ${className}`;

  const pickerHandlers = isPickerInput
    ? {
        onClick: (e: React.MouseEvent<HTMLInputElement>) => {
          openDatePicker(e.currentTarget);
          onClick?.(e);
        },
      }
    : { onClick };

  const inputEl = (
    <input
      id={id}
      type={type}
      className={inputStyles}
      aria-invalid={!!error}
      {...pickerHandlers}
      {...rest}
    />
  );

  if (label) {
    return (
      <div className="space-y-2">
        <label
          htmlFor={id}
          className="block text-sm font-medium text-foreground"
        >
          {label}
        </label>
        <div className="relative">
          {Icon && (
            <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-fg" aria-hidden />
          )}
          {inputEl}
        </div>
      </div>
    );
  }

  if (Icon) {
    return (
      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-fg" aria-hidden />
        {inputEl}
      </div>
    );
  }

  return inputEl;
};
