"use client";

import React from "react";
import PortalProductPage from "@/components/portal/PortalProductPage";
import { sellerCatalogProductLinks } from "@/utils/productDetailLinks";

export default function SellerProductPage() {
  return (
    <PortalProductPage links={sellerCatalogProductLinks()} browseHref="/seller/catalog" />
  );
}
