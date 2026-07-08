import {
  BarChart3,
  Home,
  LayoutDashboard,
  LayoutGrid,
  MessageSquare,
  Package,
  Search,
  User,
} from "lucide-react";
import type { PortalNavItem } from "@/components/portal/PortalBottomNav";

export const buyerNavItems: PortalNavItem[] = [
  { label: "Home", href: "/buyer/home", icon: Home, match: (p) => p.startsWith("/buyer/home") },
  { label: "Search", href: "/buyer/search", icon: Search, match: (p) => p.startsWith("/buyer/search") },
  {
    label: "Categories",
    href: "/buyer/categories",
    icon: LayoutGrid,
    match: (p) => p.startsWith("/buyer/categor"),
  },
  {
    label: "Inquiries",
    href: "/buyer/inquiries",
    icon: MessageSquare,
    match: (p) => p.startsWith("/buyer/inquir"),
    badge: 2,
  },
  {
    label: "Profile",
    href: "/buyer/profile",
    icon: User,
    match: (p) =>
      p.startsWith("/buyer/profile") ||
      p.startsWith("/buyer/settings") ||
      p.startsWith("/buyer/edit-profile"),
  },
];

export const sellerNavItems: PortalNavItem[] = [
  {
    label: "Dashboard",
    href: "/seller/dashboard",
    icon: LayoutDashboard,
    match: (p) => p.startsWith("/seller/dashboard"),
  },
  {
    label: "Catalog",
    href: "/seller/catalog",
    icon: Package,
    match: (p) => p.startsWith("/seller/catalog") || p.startsWith("/seller/add-product"),
  },
  {
    label: "Leads",
    href: "/seller/leads",
    icon: MessageSquare,
    match: (p) => p.startsWith("/seller/lead"),
    badge: 3,
  },
  {
    label: "Analytics",
    href: "/seller/analytics",
    icon: BarChart3,
    match: (p) => p.startsWith("/seller/analytics"),
  },
  {
    label: "Profile",
    href: "/seller/profile",
    icon: User,
    match: (p) =>
      p.startsWith("/seller/profile") ||
      p.startsWith("/seller/edit-profile") ||
      p.startsWith("/seller/plans"),
  },
];
