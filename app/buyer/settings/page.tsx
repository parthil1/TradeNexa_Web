"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import RoleSwitcher from "@/components/portal/RoleSwitcher";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import DeleteAccountButton from "@/components/portal/DeleteAccountButton";

export default function BuyerSettingsPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-5 sm:px-6 lg:px-8">
      <PortalPageHeader title="Settings" />
      <div className="mb-6">
        <RoleSwitcher />
      </div>
      <div className="space-y-4">
        {[
          { label: "Push Notifications", desc: "Order updates and quotes", defaultOn: true },
          { label: "Email Updates", desc: "Weekly marketplace digest", defaultOn: true },
          { label: "Two-Factor Auth", desc: "Extra security for your account", defaultOn: false },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between surface-card p-4">
            <div>
              <p className="text-sm font-extrabold text-foreground">{item.label}</p>
              <p className="text-xs text-muted-fg">{item.desc}</p>
            </div>
            <div className={`h-6 w-11 rounded-full p-0.5 ${item.defaultOn ? "bg-primary" : "bg-border"}`}>
              <div className={`h-5 w-5 rounded-full bg-white shadow transition ${item.defaultOn ? "translate-x-5" : ""}`} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8">
        <DeleteAccountButton />
      </div>
      <Link href="/buyer/profile" className="mt-6 flex items-center justify-center gap-1 text-sm font-semibold text-primary">
        <ChevronRight className="h-4 w-4 rotate-180" />
        Back to Profile
      </Link>
    </div>
  );
}
