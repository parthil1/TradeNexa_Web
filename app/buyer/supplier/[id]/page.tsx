"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BadgeCheck, MapPin, Star } from "lucide-react";
import PortalBackLink from "@/components/portal/PortalBackLink";
import { demoSuppliers } from "@/data/portalDemo";

export default function BuyerSupplierPage() {
  const params = useParams();
  const supplier = demoSuppliers.find((s) => s.id === params.id) ?? demoSuppliers[0];

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 lg:px-8">
      <PortalBackLink href="/buyer/home" />
      <div className="rounded-3xl border border-[#E8ECF0] bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E8EFF9] text-2xl font-extrabold text-[#1565C0]">
            {supplier.name[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-[#0D1B2A]">{supplier.name}</h1>
              {supplier.verified ? <BadgeCheck className="h-5 w-5 text-[#1565C0]" /> : null}
            </div>
            <p className="mt-1 text-sm text-[#546E7A]">{supplier.category}</p>
            <p className="mt-2 flex items-center gap-1 text-sm text-[#546E7A]">
              <MapPin className="h-4 w-4" />
              {supplier.location}
            </p>
            <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-amber-600">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {supplier.rating} rating
            </p>
          </div>
        </div>
        <p className="mt-6 text-sm text-[#546E7A]">
          {supplier.productCount} products listed on TradeNexa. Browse catalog and send inquiries directly.
        </p>
        <Link
          href="/buyer/send-inquiry"
          className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-[#1565C0] py-3 text-sm font-bold text-white"
        >
          Contact Supplier
        </Link>
      </div>
    </div>
  );
}
