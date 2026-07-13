"use client";

import React, { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Layers } from "lucide-react";
import { resolveImageUrl, getInitials } from "@/utils/catalogHelpers";

interface CatalogImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackIcon?: LucideIcon;
  fallbackClassName?: string;
  showInitials?: boolean;
}

export default function CatalogImage({
  src,
  alt,
  className = "h-full w-full object-cover",
  fallbackIcon: FallbackIcon = Layers,
  fallbackClassName = "bg-gradient-to-br from-primary/10 via-primary/5 to-muted",
  showInitials = false,
}: CatalogImageProps) {
  const [failed, setFailed] = useState(false);
  const resolved = resolveImageUrl(src);

  if (!resolved || failed) {
    return (
      <div className={`flex h-full w-full items-center justify-center ${fallbackClassName}`}>
        {showInitials ? (
          <span className="text-4xl font-black text-primary/25">{getInitials(alt)}</span>
        ) : (
          <FallbackIcon className="h-12 w-12 text-primary/35" />
        )}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolved}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
