"use client";

import React, { useState } from "react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import PortalBackLink from "@/components/portal/PortalBackLink";
import { showSuccessToast } from "@/utils/toast";

export default function SellerAddProductPage() {
  const [name, setName] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    showSuccessToast("Product submitted for review!");
    setName("");
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-5 sm:px-6 lg:px-8">
      <PortalBackLink href="/seller/catalog" />
      <PortalPageHeader title="Add Product" subtitle="List a new product in your catalog" />
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-[#E8ECF0] bg-white p-6">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[#546E7A]">Product Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-xl border border-[#E0E6ED] px-4 py-3 text-sm outline-none focus:border-[#1565C0]"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#546E7A]">Price (₹)</label>
            <input type="number" className="w-full rounded-xl border border-[#E0E6ED] px-4 py-3 text-sm outline-none focus:border-[#1565C0]" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#546E7A]">MOQ</label>
            <input type="number" className="w-full rounded-xl border border-[#E0E6ED] px-4 py-3 text-sm outline-none focus:border-[#1565C0]" />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[#546E7A]">Description</label>
          <textarea rows={4} className="w-full rounded-xl border border-[#E0E6ED] px-4 py-3 text-sm outline-none focus:border-[#1565C0]" />
        </div>
        <button type="submit" className="w-full rounded-2xl bg-[#1565C0] py-3.5 text-sm font-bold text-white">
          Submit Product
        </button>
      </form>
    </div>
  );
}
