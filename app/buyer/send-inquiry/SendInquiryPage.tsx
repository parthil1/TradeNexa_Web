"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import PortalBackLink from "@/components/portal/PortalBackLink";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

export default function SendInquiryPage() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("product");
  const [message, setMessage] = useState("");
  const [quantity, setQuantity] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) {
      showErrorToast("Please enter your inquiry message.");
      return;
    }
    showSuccessToast("Inquiry sent successfully!");
    setMessage("");
    setQuantity("");
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-5 sm:px-6 lg:px-8">
      <PortalBackLink href={productId ? `/buyer/product/${productId}` : "/buyer/inquiries"} />
      <PortalPageHeader title="Send Inquiry" subtitle="Get a quote from the supplier" />
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-[#E8ECF0] bg-white p-6">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[#546E7A]">Quantity Required</label>
          <input
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="e.g. 500 units"
            className="w-full rounded-xl border border-[#E0E6ED] px-4 py-3 text-sm outline-none focus:border-[#1565C0]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-[#546E7A]">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder="Describe your requirement..."
            className="w-full rounded-xl border border-[#E0E6ED] px-4 py-3 text-sm outline-none focus:border-[#1565C0]"
          />
        </div>
        <button type="submit" className="w-full rounded-2xl bg-[#1565C0] py-3.5 text-sm font-bold text-white">
          Send Inquiry
        </button>
      </form>
    </div>
  );
}
