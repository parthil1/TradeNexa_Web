"use client";

import React from "react";
import { BarChart3, Crown, Package, Settings, Store } from "lucide-react";
import PortalProfileView from "@/components/portal/PortalProfileView";

const menuItems = [
  {
    label: "Edit Profile",
    href: "/seller/edit-profile",
    icon: Settings,
    description: "Update company profile and business information",
  },
  {
    label: "Subscription Plans",
    href: "/seller/plans",
    icon: Crown,
    description: "View and manage your seller subscription",
  },
  {
    label: "Add Product",
    href: "/seller/add-product",
    icon: Package,
    description: "List a new product in your catalog",
  },
  {
    label: "My Catalog",
    href: "/seller/catalog",
    icon: Store,
    description: "Browse and manage your listed products",
  },
  {
    label: "Analytics",
    href: "/seller/analytics",
    icon: BarChart3,
    description: "Track views, leads, and performance metrics",
  },
];

export default function SellerProfilePage() {
  return <PortalProfileView variant="seller" menuItems={menuItems} />;
}
