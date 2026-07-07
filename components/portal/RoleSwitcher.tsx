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
      className="flex w-full items-center justify-between rounded-2xl border border-[#E0E6ED] bg-white p-4 text-left transition hover:border-[#1565C0]"
    >
      <div>
        <p className="text-sm font-extrabold text-[#0D1B2A]">Switch Account Role</p>
        <p className="mt-0.5 text-xs text-[#546E7A]">
          Currently in <span className="font-semibold capitalize">{activeRole}</span> mode
        </p>
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-[#E8EFF9] px-3 py-2 text-xs font-bold text-[#1565C0]">
        <ArrowLeftRight className="h-4 w-4" />
        {switchTo === "seller" ? "Seller" : "Buyer"}
      </div>
    </button>
  );
}
