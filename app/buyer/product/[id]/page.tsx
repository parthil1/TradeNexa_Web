"use client";

import React, { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import PortalProductPage from "@/components/portal/PortalProductPage";
import { useActiveRole } from "@/context/ActiveRoleContext";
import { PORTAL_PRODUCT_LINKS } from "@/utils/productDetailLinks";

export default function BuyerProductPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = Number(params.id);
  const { activeRole } = useActiveRole();

  useEffect(() => {
    if (!productId || Number.isNaN(productId)) return;

    const fromSellerCatalog = searchParams.get("from") === "seller-catalog";
    if (fromSellerCatalog || activeRole === "seller") {
      router.replace(`/seller/product/${productId}`);
    }
  }, [activeRole, productId, router, searchParams]);

  return (
    <PortalProductPage links={PORTAL_PRODUCT_LINKS} browseHref="/buyer/search" />
  );
}
