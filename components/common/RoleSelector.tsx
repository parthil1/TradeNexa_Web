"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
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
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col items-center rounded-xl border border-border bg-muted p-4"
          >
            <div className="skeleton mb-3 h-10 w-10 rounded-xl" />
            <div className="skeleton h-3 w-16 rounded" />
            <div className="skeleton mt-2 h-2 w-24 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!roles.length) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted px-4 py-8 text-center">
        <p className="text-sm font-medium text-muted-fg">Unable to load account types</p>
        <p className="mt-1 text-xs text-muted-fg">Please refresh and try again</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className={`grid gap-3 ${compact ? "grid-cols-3" : "grid-cols-1 sm:grid-cols-3"}`}>
        {roles.map((role, index) => {
          const Icon = ROLE_ICONS[role.userRole];
          const isSelected = value === role.userRole;
          return (
            <motion.button
              key={role.id}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.25 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChange(role.userRole)}
              className={`group relative flex flex-col items-center rounded-xl border text-center transition-all duration-200 ${
                compact ? "p-3" : "p-4"
              } ${
                isSelected
                  ? "border-primary bg-primary/[0.04] shadow-[0_0_0_1px_rgba(37,99,235,0.15),0_4px_16px_-4px_rgba(37,99,235,0.15)]"
                  : "border-border bg-card hover:border-muted hover:shadow-sm"
              } ${error && !value ? "border-error/30" : ""}`}
            >
              <div
                className={`flex items-center justify-center rounded-xl transition-all duration-200 ${
                  compact ? "mb-2 h-9 w-9" : "mb-3 h-10 w-10"
                } ${
                  isSelected
                    ? "bg-primary text-white shadow-sm"
                    : "bg-muted text-muted-fg group-hover:bg-primary/10 group-hover:text-primary"
                }`}
              >
                <Icon className={compact ? "h-4 w-4" : "h-5 w-5"} />
              </div>
              <span
                className={`font-semibold ${compact ? "text-[11px] leading-tight" : "text-sm"} ${
                  isSelected ? "text-primary" : "text-foreground"
                }`}
              >
                {role.name}
              </span>
              {!compact && (
                <span className="mt-1 text-[11px] leading-snug text-muted-fg">
                  {role.description}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
      {error && <p className="text-xs font-medium text-error">{error}</p>}
    </div>
  );
}
