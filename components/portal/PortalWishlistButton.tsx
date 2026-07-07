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
      className={`inline-flex items-center justify-center rounded-full bg-white shadow-sm transition hover:scale-105 ${buttonSize} ${className}`}
    >
      {label ? (
        <span className="flex items-center gap-2 px-3 text-sm font-semibold">
          <Heart
            className={`${iconSize} ${isWishlisted ? "fill-red-500 text-red-500" : "text-[#90A4AE]"}`}
          />
          {label}
        </span>
      ) : (
        <Heart
          className={`${iconSize} ${isWishlisted ? "fill-red-500 text-red-500" : "text-[#90A4AE]"}`}
        />
      )}
    </button>
  );
}
