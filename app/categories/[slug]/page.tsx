"use client";

import React from "react";
import { useParams } from "next/navigation";
import CTABanner from "@/components/CTABanner";
import WebsiteCategoryView from "@/components/catalog/WebsiteCategoryView";

export default function CategoryDetailPage() {
  const params = useParams();
  const slug = String(params.slug ?? "");

  return (
    <>
      <WebsiteCategoryView categorySlug={slug} />
      <CTABanner />
    </>
  );
}
