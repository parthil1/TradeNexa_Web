"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Heart,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  Eye,
  ShieldCheck,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import PortalSection from "@/components/portal/PortalSection";
import PortalStatCard from "@/components/portal/PortalStatCard";
import RoleSwitcher from "@/components/portal/RoleSwitcher";
import DeleteAccountButton from "@/components/portal/DeleteAccountButton";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/hooks/useWishlist";
import type { User } from "@/types/auth";

export interface PortalProfileMenuItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
}

interface PortalProfileViewProps {
  variant: "buyer" | "seller";
  menuItems: PortalProfileMenuItem[];
}

const quickActionColors = [
  "text-[#1565C0]",
  "text-[#8B5CF6]",
  "text-[#F59E0B]",
  "text-[#2E7D32]",
  "text-[#FF6D00]",
  "text-[#546E7A]",
];

const themes = {
  buyer: {
    heroGradient: "from-[#1565C0] to-[#5E92F3]",
    heroShadow: "shadow-xl shadow-[#1565C0]/25",
    accent: "text-[#1565C0]",
    editHref: "/buyer/edit-profile",
    roleLabel: "Buyer account",
  },
  seller: {
    heroGradient: "from-[#1565C0] to-[#5E92F3]",
    heroShadow: "shadow-xl shadow-[#1565C0]/25",
    accent: "text-[#1565C0]",
    editHref: "/seller/edit-profile",
    roleLabel: "Seller account",
  },
} as const;

function buildAccountDetailRows(user: User | null) {
  const rows: { icon: typeof UserIcon; label: string; value: string }[] = [];

  if (user?.name) rows.push({ icon: UserIcon, label: "Full name", value: user.name });
  if (user?.company) rows.push({ icon: Building2, label: "Company", value: user.company });
  if (user?.email) rows.push({ icon: Mail, label: "Email", value: user.email });
  if (user?.phone) rows.push({ icon: Phone, label: "Phone", value: user.phone });

  const hasCityState = Boolean(user?.city || user?.state);
  const locationValue = [user?.address, user?.city, user?.state, user?.pincode].filter(Boolean).join(", ");

  if (locationValue) {
    rows.push({
      icon: MapPin,
      label: hasCityState ? "Location" : "Address",
      value: locationValue,
    });
  }

  return rows;
}

export default function PortalProfileView({ variant, menuItems }: PortalProfileViewProps) {
  const router = useRouter();
  const { user, logoutUser } = useAuth();
  const { wishlistedIds } = useWishlist();
  const theme = themes[variant];

  const displayName = variant === "seller" ? user?.company || user?.name || "Seller" : user?.name || "Buyer";
  const secondaryLine = variant === "seller" ? user?.name : user?.company;
  const initial = (displayName || "U").charAt(0).toUpperCase();
  const accountDetails = buildAccountDetailRows(user);

  const stats =
    variant === "buyer"
      ? [
          { title: "Wishlist", value: String(wishlistedIds.length), icon: Heart, color: "text-[#FF6D00]", bg: "bg-orange-50" },
          { title: "Account Type", value: "Buyer", icon: ShieldCheck, color: "text-[#2E7D32]", bg: "bg-emerald-50" },
          {
            title: "Company",
            value: user?.company ? (user.company.length > 12 ? `${user.company.slice(0, 12)}…` : user.company) : "—",
            icon: Building2,
            color: "text-[#1565C0]",
            bg: "bg-blue-50",
          },
          { title: "Status", value: "Active", icon: BadgeCheck, color: "text-[#8B5CF6]", bg: "bg-violet-50" },
        ]
      : [
          { title: "New Leads", value: "48", icon: MessageSquare, color: "text-[#FF6D00]", bg: "bg-orange-50" },
          { title: "Profile Views", value: "1.2k", icon: Eye, color: "text-[#2E7D32]", bg: "bg-emerald-50" },
          { title: "Listings", value: "24", icon: Package, color: "text-[#1565C0]", bg: "bg-blue-50" },
          { title: "Status", value: "Verified", icon: BadgeCheck, color: "text-[#F59E0B]", bg: "bg-amber-50" },
        ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <p className="text-sm text-[#546E7A]">Your account,</p>
        <h2 className="text-2xl font-extrabold text-[#0D1B2A] sm:text-3xl">{displayName}</h2>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className={`mb-8 overflow-hidden rounded-3xl bg-gradient-to-br ${theme.heroGradient} p-6 text-white ${theme.heroShadow} sm:p-8`}
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-2xl font-extrabold text-white ring-4 ring-white/30 sm:h-20 sm:w-20 sm:text-3xl">
              {initial}
            </div>
            <div className="min-w-0">
              <span className="inline-flex rounded-lg bg-white/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/90">
                {theme.roleLabel}
              </span>
              <h3 className="mt-2 truncate text-xl font-extrabold sm:text-2xl">{displayName}</h3>
              {secondaryLine ? <p className="mt-1 truncate text-sm text-white/80">{secondaryLine}</p> : null}
              {user?.phone ? <p className="mt-1 text-xs text-white/70">{user.phone}</p> : null}
            </div>
          </div>
          <Link
            href={theme.editHref}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#1565C0] transition hover:bg-white/90"
          >
            Edit Profile
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.div>

      <PortalSection title="Account Overview">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((stat) => (
            <PortalStatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              bg={stat.bg}
            />
          ))}
        </div>
      </PortalSection>

      <PortalSection title="Quick Actions" subtitle="Shortcuts to manage your account">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const color = quickActionColors[index % quickActionColors.length];
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex flex-col items-center gap-2 rounded-2xl border border-[#E8ECF0] bg-white p-3 shadow-sm transition hover:border-[#1565C0]/30 hover:shadow-md sm:p-4"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#E8ECF0] bg-white transition group-hover:scale-105 sm:h-16 sm:w-16">
                  <Icon className={`h-6 w-6 sm:h-7 sm:w-7 ${color}`} />
                </div>
                <span className="line-clamp-2 text-center text-[10px] font-bold text-[#546E7A] sm:text-[11px]">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </PortalSection>

      <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="lg:col-span-2">
          <PortalSection title="Account Details" subtitle="Your registered information">
            {accountDetails.length > 0 ? (
              <div className="overflow-hidden rounded-2xl border border-[#E8ECF0] bg-white shadow-sm">
                {accountDetails.map((row, index) => {
                  const Icon = row.icon;
                  return (
                    <div
                      key={row.label}
                      className={`grid gap-3 px-4 py-4 sm:grid-cols-[140px_1fr] sm:items-center sm:gap-6 sm:px-5 ${
                        index < accountDetails.length - 1 ? "border-b border-[#E8ECF0]" : ""
                      } ${index % 2 === 1 ? "bg-[#FAFBFC]" : "bg-white"}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E8EFF9]">
                          <Icon className="h-4 w-4 text-[#1565C0]" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wide text-[#546E7A]">
                          {row.label}
                        </span>
                      </div>
                      <p className="text-sm font-extrabold text-[#0D1B2A] sm:text-base">{row.value}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#E0E6ED] bg-white px-5 py-8 text-center">
                <p className="text-sm font-semibold text-[#546E7A]">No account details available yet.</p>
                <Link
                  href={theme.editHref}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-[#1565C0]"
                >
                  Complete your profile
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </PortalSection>
        </div>

        <div className="space-y-6">
          <RoleSwitcher />

          <div className="rounded-2xl border border-[#E8ECF0] bg-white p-5 shadow-sm">
            <p className="text-sm font-extrabold text-[#0D1B2A]">Sign out</p>
            <p className="mt-1 text-xs leading-relaxed text-[#546E7A]">
              Sign out from your account on this device.
            </p>
            <button
              type="button"
              onClick={() => {
                void logoutUser().then(() => router.replace("/"));
              }}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#E8ECF0] bg-[#FAFBFC] px-4 py-2.5 text-sm font-bold text-[#546E7A] transition hover:border-[#1565C0]/40 hover:bg-white hover:text-[#1565C0]"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>

          <div className="rounded-2xl border border-[#E8ECF0] bg-white p-5 shadow-sm">
            <p className="text-sm font-extrabold text-[#0D1B2A]">Account security</p>
            <p className="mt-1 text-xs leading-relaxed text-[#546E7A]">
              Permanently remove your profile and all associated data from TradeNexa.
            </p>
            <div className="mt-4">
              <DeleteAccountButton compact />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
