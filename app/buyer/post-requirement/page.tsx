"use client";

import React, { useState } from "react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import PortalBackLink from "@/components/portal/PortalBackLink";
import { showSuccessToast } from "@/utils/toast";

export default function PostRequirementPage() {
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    showSuccessToast("Requirement posted! Sellers will respond shortly.");
    setTitle("");
    setDetails("");
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-5 sm:px-6 lg:px-8">
      <PortalBackLink href="/buyer/home" />
      <PortalPageHeader title="Post Requirement" subtitle="Describe what you need — get multiple quotes" />
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-[#E8ECF0] bg-white p-6">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[#546E7A]">Requirement Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Bulk Cotton Yarn 40s"
            className="w-full rounded-xl border border-[#E0E6ED] px-4 py-3 text-sm outline-none focus:border-[#1565C0]"
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[#546E7A]">Details</label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={6}
            placeholder="Quantity, specifications, delivery location..."
            className="w-full rounded-xl border border-[#E0E6ED] px-4 py-3 text-sm outline-none focus:border-[#1565C0]"
            required
          />
        </div>
        <button type="submit" className="w-full rounded-2xl bg-gradient-to-r from-[#E65100] to-[#FF6D00] py-3.5 text-sm font-bold text-white">
          Post Requirement
        </button>
      </form>
    </div>
  );
}
