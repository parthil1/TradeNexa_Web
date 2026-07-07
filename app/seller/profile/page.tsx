"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronRight, Crown, Package, Settings } from "lucide-react";
import RoleSwitcher from "@/components/portal/RoleSwitcher";
import DeleteAccountButton from "@/components/portal/DeleteAccountButton";
import { useAuth } from "@/hooks/useAuth";

const menuItems = [
  { label: "Edit Profile", href: "/seller/edit-profile", icon: Settings },
  { label: "Subscription Plans", href: "/seller/plans", icon: Crown },
  { label: "Add Product", href: "/seller/add-product", icon: Package },
];

export default function SellerProfilePage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-xl px-4 py-5 sm:px-6 lg:px-8">
      <div className="mb-6 rounded-3xl border border-[#E8ECF0] bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#E65100] to-[#FF6D00] text-2xl font-extrabold text-white">
          {(user?.company || user?.name || "S")[0]}
        </div>
        <h2 className="mt-4 text-xl font-extrabold text-[#0D1B2A]">{user?.company || "Seller"}</h2>
        <p className="text-sm text-[#546E7A]">{user?.name}</p>
        <p className="mt-1 text-xs text-[#546E7A]">{user?.phone}</p>
      </div>

      <div className="mb-4">
        <RoleSwitcher />
      </div>

      <div className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-2xl border border-[#E8ECF0] bg-white px-4 py-3.5 transition hover:border-[#FF6D00]/30"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50">
                <Icon className="h-4 w-4 text-[#FF6D00]" />
              </div>
              <span className="flex-1 text-sm font-semibold text-[#0D1B2A]">{item.label}</span>
              <ChevronRight className="h-4 w-4 text-[#B0BEC5]" />
            </Link>
          );
        })}
      </div>

      <div className="mt-8">
        <DeleteAccountButton />
      </div>
    </div>
  );
}
