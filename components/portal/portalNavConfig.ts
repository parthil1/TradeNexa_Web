import {
  BarChart3,
  ClipboardList,
  Home,
  LayoutDashboard,
  LayoutGrid,
  MessagesSquare,
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
    label: "RFQs",
    href: "/buyer/inquiries",
    icon: ClipboardList,
    match: (p) =>
      p === "/buyer/inquiries" ||
      p.startsWith("/buyer/inquiries/") ||
      p.startsWith("/buyer/rfq") ||
      p.startsWith("/buyer/post-requirement"),
  },
  {
    label: "Inquiries",
    href: "/buyer/product-inquiries",
    icon: MessageSquare,
    match: (p) =>
      p.startsWith("/buyer/product-inquiries") || p.startsWith("/buyer/send-inquiry"),
  },
  {
    label: "Chats",
    href: "/buyer/chats",
    icon: MessagesSquare,
    match: (p) => p.startsWith("/buyer/chats"),
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
    match: (p) =>
      p.startsWith("/seller/catalog") ||
      p.startsWith("/seller/add-product") ||
      p.startsWith("/seller/edit-product") ||
      p.startsWith("/seller/product"),
  },
  {
    label: "RFQs",
    href: "/seller/leads",
    icon: ClipboardList,
    match: (p) =>
      p.startsWith("/seller/lead") || p.startsWith("/seller/quotations"),
  },
  {
    label: "Inquiries",
    href: "/seller/inquiries",
    icon: MessageSquare,
    match: (p) => p.startsWith("/seller/inquiries"),
  },
  {
    label: "Chats",
    href: "/seller/chats",
    icon: MessagesSquare,
    match: (p) => p.startsWith("/seller/chats"),
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
