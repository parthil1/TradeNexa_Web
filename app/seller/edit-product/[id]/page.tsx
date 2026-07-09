"use client";

import React from "react";
import { useParams } from "next/navigation";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import PortalBackLink from "@/components/portal/PortalBackLink";
import AddProductForm from "@/components/seller/AddProductForm";

export default function SellerEditProductPage() {
  const params = useParams();
  const productId = Number(params.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 lg:px-8">
      <PortalBackLink href="/seller/catalog" label="Back to Catalog" />
      <PortalPageHeader title="Edit Product" subtitle="Update your listing details and media" />
      <AddProductForm productId={productId} />
    </div>
  );
}
