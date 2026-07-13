"use client";

import React from "react";
import { textareaClassName } from "./FormField";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  id: string;
  error?: boolean;
}

export function Textarea({ id, error, className = "", ...rest }: TextareaProps) {
  return (
    <textarea
      id={id}
      aria-invalid={!!error}
      className={`${textareaClassName(error)} ${className}`}
      {...rest}
    />
  );
}
