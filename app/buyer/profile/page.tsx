"use client";

import React from "react";
import { Heart, HelpCircle, MapPin, Settings, Shield, User } from "lucide-react";
import PortalProfileView from "@/components/portal/PortalProfileView";

const menuItems = [
  {
    label: "Edit Profile",
    href: "/buyer/edit-profile",
    icon: User,
    description: "Update your name, company, and contact details",
  },
  {
    label: "Saved Addresses",
    href: "/buyer/addresses",
    icon: MapPin,
    description: "Manage delivery and billing locations",
  },
  {
    label: "Wishlist",
    href: "/buyer/wishlist",
    icon: Heart,
    description: "View products you have saved for later",
  },
  {
    label: "Settings",
    href: "/buyer/settings",
    icon: Settings,
    description: "Notifications, security, and preferences",
  },
  {
    label: "Help & Support",
    href: "/buyer/help",
    icon: HelpCircle,
    description: "Get help with orders, quotes, and account issues",
  },
  {
    label: "Privacy Policy",
    href: "/buyer/privacy",
    icon: Shield,
    description: "Read how your data is collected and used",
  },
];

export default function BuyerProfilePage() {
  return <PortalProfileView variant="buyer" menuItems={menuItems} />;
}
