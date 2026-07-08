"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight } from "lucide-react";
import { useActiveRole } from "@/context/ActiveRoleContext";
import { writeStoredActiveRole } from "@/utils/roleNavigation";

export default function RoleSwitcher() {
  const router = useRouter();
  const { activeRole, canSwitchRole, setActiveRole } = useActiveRole();

  if (!canSwitchRole) return null;

  const switchTo = activeRole === "buyer" ? "seller" : "buyer";
  const targetPath = switchTo === "seller" ? "/seller/dashboard" : "/buyer/home";

  return (
    <button
      type="button"
      onClick={() => {
        setActiveRole(switchTo);
        writeStoredActiveRole(switchTo);
        router.push(targetPath);
      }}
      className="flex w-full items-center justify-between rounded-xl border border-portal-border bg-white p-4 text-left shadow-sm transition hover:border-portal-buyer/30 hover:shadow-[0_4px_16px_-4px_rgba(15,23,42,0.08)] sm:p-5"
    >
      <div>
        <p className="text-sm font-extrabold text-portal-fg">Switch Account Role</p>
        <p className="mt-0.5 text-xs text-portal-muted">
          Currently in <span className="font-semibold capitalize">{activeRole}</span> mode
        </p>
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-portal-buyer-light px-3 py-2 text-xs font-bold text-portal-buyer">
        <ArrowLeftRight className="h-4 w-4" />
        {switchTo === "seller" ? "Switch to Seller" : "Switch to Buyer"}
      </div>
    </button>
  );
}
