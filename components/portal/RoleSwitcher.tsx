"use client";

import { useActiveRole } from "@/context/ActiveRoleContext";
import { ArrowLeftRight } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

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
        router.push(targetPath);
      }}
      className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 text-left transition hover:border-primary/30 hover:shadow-[var(--shadow-card)] sm:p-5"
    >
      <div>
        <p className="text-sm font-semibold text-foreground">Switch Account Role</p>
        <p className="mt-0.5 text-xs text-muted-fg">
          Currently in <span className="font-semibold capitalize">{activeRole}</span> mode
        </p>
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-primary-soft px-3 py-2 text-xs font-bold text-primary">
        <ArrowLeftRight className="h-4 w-4" />
        {switchTo === "seller" ? "Switch to Seller" : "Switch to Buyer"}
      </div>
    </button>
  );
}
