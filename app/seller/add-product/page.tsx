"use client";

import React from "react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import PortalBackLink from "@/components/portal/PortalBackLink";
import AddProductForm from "@/components/seller/AddProductForm";

export default function SellerAddProductPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 lg:px-8">
      <PortalBackLink href="/seller/catalog" label="Back to Catalog" />
      <PortalPageHeader title="Add Product" subtitle="Fill in the details below to list a new product" />
      <AddProductForm />
    </div>
  );
}
