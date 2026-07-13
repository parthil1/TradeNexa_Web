"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import PortalBackLink from "@/components/portal/PortalBackLink";
import { Button } from "@/components/common/Button";
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
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-white p-6">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-muted-fg">Quantity Required</label>
          <input
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="e.g. 500 units"
            className="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-muted-fg">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder="Describe your requirement..."
            className="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <Button type="submit" variant="primary" size="lg" fullWidth>
          Send Inquiry
        </Button>
      </form>
    </div>
  );
}
