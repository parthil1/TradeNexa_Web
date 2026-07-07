"use client";

import React from "react";
import { useParams } from "next/navigation";
import CTABanner from "@/components/CTABanner";
import WebsiteCategoryView from "@/components/catalog/WebsiteCategoryView";

export default function SubcategoryProductsPage() {
  const params = useParams();
  const categorySlug = String(params.slug ?? "");
  const subSlug = String(params.subSlug ?? "");

  return (
    <>
      <WebsiteCategoryView categorySlug={categorySlug} initialSubSlug={subSlug} />
      <CTABanner />
    </>
  );
}
