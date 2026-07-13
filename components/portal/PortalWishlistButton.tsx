"use client";

import React from "react";
import { Heart } from "lucide-react";

interface PortalWishlistButtonProps {
  isWishlisted: boolean;
  onToggle: () => void;
  size?: "sm" | "md";
  className?: string;
  label?: string;
}

export default function PortalWishlistButton({
  isWishlisted,
  onToggle,
  size = "sm",
  className = "",
  label,
}: PortalWishlistButtonProps) {
  const iconSize = size === "md" ? "h-5 w-5" : "h-4 w-4";
  const buttonSize = size === "md" ? "h-10 w-10" : "h-8 w-8";
  const heartClass = isWishlisted
    ? "fill-error text-error stroke-error"
    : "fill-none text-muted-fg stroke-muted-fg";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={isWishlisted}
      className={`inline-flex cursor-pointer items-center justify-center rounded-full shadow-sm transition-all duration-200 hover:scale-105 ${buttonSize} ${
        isWishlisted ? "bg-error/10 ring-1 ring-error/30" : "bg-card"
      } ${className}`}
    >
      {label ? (
        <span className="flex items-center gap-2 px-3 text-sm font-semibold">
          <Heart className={`${iconSize} ${heartClass}`} strokeWidth={2} />
          {label}
        </span>
      ) : (
        <Heart className={`${iconSize} ${heartClass}`} strokeWidth={2} />
      )}
    </button>
  );
}
