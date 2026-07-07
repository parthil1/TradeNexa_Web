"use client";

import React from "react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import PortalBackLink from "@/components/portal/PortalBackLink";
import { useAuth } from "@/hooks/useAuth";
import { showSuccessToast } from "@/utils/toast";

export default function SellerEditProfilePage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-xl px-4 py-5 sm:px-6 lg:px-8">
      <PortalBackLink href="/seller/profile" />
      <PortalPageHeader title="Edit Seller Profile" />
      <div className="space-y-4 rounded-2xl border border-[#E8ECF0] bg-white p-6">
        {[
          { label: "Company Name", value: user?.company },
          { label: "Contact Name", value: user?.name },
          { label: "Email", value: user?.email },
          { label: "GST Number", value: "" },
        ].map((field) => (
          <div key={field.label}>
            <label className="mb-1 block text-xs font-bold text-[#546E7A]">{field.label}</label>
            <input
              defaultValue={field.value || ""}
              className="w-full rounded-xl border border-[#E0E6ED] px-4 py-3 text-sm outline-none focus:border-[#FF6D00]"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => showSuccessToast("Profile updated")}
          className="w-full rounded-2xl bg-[#FF6D00] py-3 text-sm font-bold text-white"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
