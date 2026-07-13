"use client";

import React from "react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import PortalBackLink from "@/components/portal/PortalBackLink";
import { useAuth } from "@/hooks/useAuth";

export default function BuyerAddressesPage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-xl px-4 py-5 sm:px-6 lg:px-8">
      <PortalBackLink href="/buyer/profile" />
      <PortalPageHeader title="Saved Addresses" />
      <div className="rounded-2xl border border-border bg-white p-4">
        <p className="text-sm font-extrabold text-foreground">Default Address</p>
        <p className="mt-2 text-sm text-muted-fg">
          {[user?.address, user?.city, user?.state, user?.pincode].filter(Boolean).join(", ") ||
            "No address saved yet."}
        </p>
      </div>
    </div>
  );
}
