"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BadgeCheck, MapPin, Star } from "lucide-react";
import PortalBackLink from "@/components/portal/PortalBackLink";
import { Button } from "@/components/common/Button";
import { demoSuppliers } from "@/data/portalDemo";

export default function BuyerSupplierPage() {
  const params = useParams();
  const supplier = demoSuppliers.find((s) => s.id === params.id) ?? demoSuppliers[0];

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 lg:px-8">
      <PortalBackLink href="/buyer/home" />
      <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-2xl font-extrabold text-primary">
            {supplier.name[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-foreground">{supplier.name}</h1>
              {supplier.verified ? <BadgeCheck className="h-5 w-5 text-primary" /> : null}
            </div>
            <p className="mt-1 text-sm text-muted-fg">{supplier.category}</p>
            <p className="mt-2 flex items-center gap-1 text-sm text-muted-fg">
              <MapPin className="h-4 w-4" />
              {supplier.location}
            </p>
            <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-amber-600">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {supplier.rating} rating
            </p>
          </div>
        </div>
        <p className="mt-6 text-sm text-muted-fg">
          {supplier.productCount} products listed on TradeNexa. Browse catalog and send inquiries directly.
        </p>
        <Link href="/buyer/send-inquiry" className="mt-6 block">
          <Button variant="primary" size="lg" fullWidth>
            Contact Supplier
          </Button>
        </Link>
      </div>
    </div>
  );
}
