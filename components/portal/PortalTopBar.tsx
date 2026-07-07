"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Bell, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useActiveRole } from "@/context/ActiveRoleContext";
import { Logo } from "@/components/common/Logo";

interface PortalTopBarProps {
  title: string;
  subtitle?: string;
  accent?: "buyer" | "seller";
}

export default function PortalTopBar({ title, subtitle, accent = "buyer" }: PortalTopBarProps) {
  const router = useRouter();
  const { user, logoutUser } = useAuth();
  const { canSwitchRole, activeRole, setActiveRole } = useActiveRole();

  const accentColor = accent === "seller" ? "text-[#FF6D00]" : "text-[#1565C0]";

  function switchRole() {
    const next = activeRole === "buyer" ? "seller" : "buyer";
    setActiveRole(next);
    router.push(next === "seller" ? "/seller/dashboard" : "/buyer/home");
  }

  return (
    <header className="z-40 shrink-0 border-b border-[#E0E6ED] bg-white/95 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6 lg:h-16">
        <div className="flex min-w-0 items-center gap-3">
          <div className="lg:hidden">
            <Logo size="sm" href={activeRole === "seller" ? "/seller/dashboard" : "/buyer/home"} />
          </div>
          <div className="min-w-0">
            <h1 className={`truncate text-base font-extrabold sm:text-lg ${accentColor}`}>{title}</h1>
            {subtitle ? (
              <p className="truncate text-xs text-[#546E7A]">{subtitle}</p>
            ) : user?.company ? (
              <p className="truncate text-xs text-[#546E7A]">{user.company}</p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {canSwitchRole ? (
            <button
              type="button"
              onClick={switchRole}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E0E6ED] px-2.5 py-1.5 text-xs font-semibold text-[#546E7A] transition hover:border-[#1565C0] hover:text-[#1565C0] sm:px-3"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {activeRole === "buyer" ? "Seller Mode" : "Buyer Mode"}
              </span>
            </button>
          ) : null}

          <Link
            href={activeRole === "seller" ? "/seller/leads" : "/buyer/notifications"}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[#546E7A] transition hover:bg-[#F4F6F9]"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </Link>

          <button
            type="button"
            onClick={() => logoutUser()}
            className="hidden h-9 w-9 items-center justify-center rounded-xl text-[#546E7A] transition hover:bg-red-50 hover:text-red-600 sm:flex"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
