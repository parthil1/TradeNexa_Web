"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Star } from "lucide-react";
import { getInitials, resolveImageUrl } from "@/utils/catalogHelpers";
import type { ApiSupplier } from "@/types/supplier";

interface SupplierCardProps {
  supplier: ApiSupplier;
  className?: string;
}

export default function SupplierCard({ supplier, className = "" }: SupplierCardProps) {
  const [logoFailed, setLogoFailed] = useState(false);
  const logoUrl = resolveImageUrl(supplier.logo);
  const showLogo = Boolean(logoUrl) && !logoFailed;
  const rating = supplier.rating ?? 0;
  const productCount = supplier.product_count ?? 0;
  const industry = supplier.industry?.trim() || "Supplier";

  return (
    <Link
      href={`/buyer/supplier/${supplier.id}`}
      className={`surface-card-hover block p-4 ${className}`}
    >
      <div className="flex items-start justify-between">
        <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-primary-soft text-sm font-semibold text-primary">
          {showLogo ? (
            <Image
              src={logoUrl as string}
              alt={supplier.company_name}
              width={40}
              height={40}
              className="h-full w-full object-cover"
              unoptimized
              onError={() => setLogoFailed(true)}
            />
          ) : (
            getInitials(supplier.company_name)
          )}
        </span>
        {supplier.verified ? (
          <BadgeCheck className="h-5 w-5 text-primary" aria-hidden />
        ) : null}
      </div>
      <p className="mt-3 line-clamp-2 text-sm font-semibold text-foreground">
        {supplier.company_name}
      </p>
      <p className="mt-1 line-clamp-1 text-xs text-muted-fg">{industry}</p>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 font-semibold text-warning">
          <Star className="h-3.5 w-3.5 fill-warning text-warning" aria-hidden />
          {Number.isInteger(rating) ? rating : rating.toFixed(1)}
        </span>
        <span className="text-muted-fg">
          {productCount} product{productCount === 1 ? "" : "s"}
        </span>
      </div>
    </Link>
  );
}
