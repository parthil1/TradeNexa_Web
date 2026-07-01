import React from "react";

interface IndianFlagProps {
  className?: string;
}

/** SVG Indian flag — renders consistently across Windows, macOS, and mobile */
export function IndianFlag({ className = "h-4 w-5 shrink-0 rounded-sm" }: IndianFlagProps) {
  return (
    <svg
      viewBox="0 0 24 16"
      className={className}
      aria-hidden="true"
      role="img"
    >
      <rect width="24" height="5.33" fill="#FF9933" />
      <rect y="5.33" width="24" height="5.34" fill="#FFFFFF" />
      <rect y="10.67" width="24" height="5.33" fill="#138808" />
      <circle cx="12" cy="8" r="2.2" fill="none" stroke="#000080" strokeWidth="0.35" />
      <circle cx="12" cy="8" r="0.5" fill="#000080" />
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i * 15 * Math.PI) / 180;
        const x1 = 12 + 0.5 * Math.cos(angle);
        const y1 = 8 + 0.5 * Math.sin(angle);
        const x2 = 12 + 2 * Math.cos(angle);
        const y2 = 8 + 2 * Math.sin(angle);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#000080"
            strokeWidth="0.2"
          />
        );
      })}
    </svg>
  );
}
