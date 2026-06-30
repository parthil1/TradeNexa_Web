"use client";

import React from "react";
import Link from "next/link";
import SectionHeading from "@/components/SectionHeading";
import TrendingProductCard, { TrendingProduct } from "@/components/TrendingProductCard";
import { ArrowRight } from "lucide-react";

const trendingProducts: TrendingProduct[] = [
  {
    id: "1",
    name: "Industrial Grade Stainless Steel Sheets (304)",
    category: "Machinery",
    priceRange: "₹185 – ₹220",
    unit: "kg",
    seller: "Shree Metal Works Pvt Ltd",
    location: "Rajkot, Gujarat",
    rating: 4.8,
    inquiries: 142,
    trend: "+32% demand",
    imageColor: "bg-gradient-to-br from-slate-600 to-slate-800",
  },
  {
    id: "2",
    name: "Organic Basmati Rice (Bulk Export Grade)",
    category: "Agriculture",
    priceRange: "₹62 – ₹78",
    unit: "kg",
    seller: "GreenHarvest Agro Exports",
    location: "Karnal, Haryana",
    rating: 4.9,
    inquiries: 218,
    trend: "Hot",
    imageColor: "bg-gradient-to-br from-emerald-500 to-green-700",
  },
  {
    id: "3",
    name: "LED Panel Lights 40W (Commercial Pack)",
    category: "Electronics",
    priceRange: "₹320 – ₹410",
    unit: "piece",
    seller: "BrightLite Electricals",
    location: "Noida, UP",
    rating: 4.7,
    inquiries: 96,
    trend: "+18% demand",
    imageColor: "bg-gradient-to-br from-blue-500 to-indigo-700",
  },
  {
    id: "4",
    name: "Corrugated Packaging Boxes (Custom Print)",
    category: "Packaging",
    priceRange: "₹12 – ₹28",
    unit: "piece",
    seller: "PackPro Industries",
    location: "Pune, Maharashtra",
    rating: 4.6,
    inquiries: 174,
    trend: "Trending",
    imageColor: "bg-gradient-to-br from-amber-500 to-orange-600",
  },
  {
    id: "5",
    name: "Cotton Yarn 40s Combed (Export Quality)",
    category: "Fashion",
    priceRange: "₹290 – ₹340",
    unit: "kg",
    seller: "TexWeave Mills Ltd",
    location: "Coimbatore, Tamil Nadu",
    rating: 4.8,
    inquiries: 131,
    trend: "+24% demand",
    imageColor: "bg-gradient-to-br from-violet-500 to-purple-700",
  },
  {
    id: "6",
    name: "Portland Cement OPC 53 Grade",
    category: "Construction",
    priceRange: "₹340 – ₹380",
    unit: "bag",
    seller: "BuildRight Cement Distributors",
    location: "Jaipur, Rajasthan",
    rating: 4.5,
    inquiries: 203,
    trend: "Hot",
    imageColor: "bg-gradient-to-br from-stone-500 to-stone-700",
  },
  {
    id: "7",
    name: "Industrial Solvent Cleaner (25L Drum)",
    category: "Chemicals",
    priceRange: "₹1,850 – ₹2,100",
    unit: "drum",
    seller: "ChemPure Solutions",
    location: "Vadodara, Gujarat",
    rating: 4.7,
    inquiries: 87,
    trend: "+15% demand",
    imageColor: "bg-gradient-to-br from-cyan-500 to-teal-700",
  },
  {
    id: "8",
    name: "Ergonomic Office Chairs (Bulk Order)",
    category: "Furniture",
    priceRange: "₹2,400 – ₹3,200",
    unit: "piece",
    seller: "ComfortDesk Furnishings",
    location: "Bengaluru, Karnataka",
    rating: 4.9,
    inquiries: 119,
    trend: "Trending",
    imageColor: "bg-gradient-to-br from-rose-500 to-pink-700",
  },
];

export default function TrendingProducts() {
  return (
    <section className="border-y border-slate-100 bg-slate-50 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="max-w-2xl">
            <SectionHeading
              badge="Popular Now"
              title="Trending Products"
              subtitle="High-demand B2B listings getting the most buyer inquiries on TradeNexa this week."
              centered={false}
            />
          </div>
          <Link
            href="/categories"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-primary shadow-sm ring-1 ring-slate-200 transition hover:bg-primary hover:text-white hover:ring-primary"
          >
            View All Products
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {trendingProducts.map((product, i) => (
            <TrendingProductCard key={product.id} product={product} delay={i * 0.05} />
          ))}
        </div>
      </div>
    </section>
  );
}
