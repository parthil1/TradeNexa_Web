"use client";

import React from "react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import PortalBackLink from "@/components/portal/PortalBackLink";
import { useAuth } from "@/hooks/useAuth";

export default function BuyerEditProfilePage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-xl px-4 py-5 sm:px-6 lg:px-8">
      <PortalBackLink href="/buyer/profile" />
      <PortalPageHeader title="Edit Profile" />
      <div className="space-y-4 rounded-2xl border border-[#E8ECF0] bg-white p-6">
        {[
          { label: "Name", value: user?.name },
          { label: "Company", value: user?.company },
          { label: "Email", value: user?.email },
          { label: "Phone", value: user?.phone },
          { label: "City", value: user?.city },
          { label: "State", value: user?.state },
        ].map((field) => (
          <div key={field.label}>
            <label className="mb-1 block text-xs font-bold text-[#546E7A]">{field.label}</label>
            <input
              defaultValue={field.value || ""}
              className="w-full rounded-xl border border-[#E0E6ED] px-4 py-3 text-sm outline-none focus:border-[#1565C0]"
            />
          </div>
        ))}
        <button type="button" className="w-full rounded-2xl bg-[#1565C0] py-3 text-sm font-bold text-white">
          Save Changes
        </button>
      </div>
    </div>
  );
}
