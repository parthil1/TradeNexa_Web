import React from "react";
import { inputClassName } from "./FormField";

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
  ...rest
}) => {
  const inputStyles = `${inputClassName(error)} ${Icon ? "pl-11" : ""} ${className}`;

  if (label) {
    return (
      <div className="space-y-2">
        <label
          htmlFor={id}
          className="block text-xs font-semibold uppercase tracking-wider text-slate-500"
        >
          {label}
        </label>
        <div className="relative">
          {Icon && (
            <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          )}
          <input id={id} className={inputStyles} aria-invalid={!!error} {...rest} />
        </div>
      </div>
    );
  }

  if (Icon) {
    return (
      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input id={id} className={inputStyles} aria-invalid={!!error} {...rest} />
      </div>
    );
  }

  return <input id={id} className={inputStyles} aria-invalid={!!error} {...rest} />;
};
