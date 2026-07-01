"use client";

import React, { useEffect, useState } from "react";
import { Store, ShoppingCart, ArrowLeftRight, Loader2 } from "lucide-react";
import type { UserRole } from "@/types/auth";
import { ensureRolesLoaded, type RegisterableRoleOption } from "@/utils/roleHelpers";

interface RoleSelectorProps {
  value: UserRole | "";
  onChange: (role: UserRole) => void;
  error?: string;
  compact?: boolean;
}

const ROLE_ICONS: Record<UserRole, typeof Store> = {
  seller: Store,
  buyer: ShoppingCart,
  both: ArrowLeftRight,
};

export function RoleSelector({ value, onChange, error, compact }: RoleSelectorProps) {
  const [roles, setRoles] = useState<RegisterableRoleOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadRoles = async () => {
      setLoading(true);
      try {
        const apiRoles = await ensureRolesLoaded();
        if (!cancelled) setRoles(apiRoles);
      } catch {
        if (!cancelled) setRoles([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadRoles();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/80 text-sm text-slate-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
        Loading account types...
      </div>
    );
  }

  if (!roles.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-sm text-slate-500">
        Unable to load account types. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className={`grid gap-3 ${compact ? "grid-cols-3" : "grid-cols-1 sm:grid-cols-3"}`}>
        {roles.map((role) => {
          const Icon = ROLE_ICONS[role.userRole];
          const isSelected = value === role.userRole;
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => onChange(role.userRole)}
              className={`group relative flex flex-col items-center rounded-xl border-2 text-center transition-all ${
                compact ? "p-2.5" : "p-4"
              } ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
                  : "border-slate-200 bg-white hover:border-primary/30 hover:bg-slate-50"
              } ${error && !value ? "border-red-300" : ""}`}
            >
              <div
                className={`flex items-center justify-center rounded-lg transition-colors ${
                  compact ? "mb-1 h-8 w-8" : "mb-2 h-10 w-10"
                } ${
                  isSelected
                    ? "bg-primary text-white"
                    : "bg-slate-100 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary"
                }`}
              >
                <Icon className={compact ? "h-4 w-4" : "h-5 w-5"} />
              </div>
              <span
                className={`font-bold ${compact ? "text-[11px] leading-tight" : "text-sm"} ${
                  isSelected ? "text-primary" : "text-slate-900"
                }`}
              >
                {role.name}
              </span>
              {!compact && (
                <span className="mt-1 text-[11px] leading-snug text-slate-500">
                  {role.description}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
}
