"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import type { UserRole } from "@/types/auth";
import {
  type ActiveRole,
  getDefaultActiveRole,
  readStoredActiveRole,
  writeStoredActiveRole,
} from "@/utils/roleNavigation";

interface ActiveRoleContextValue {
  activeRole: ActiveRole;
  setActiveRole: (role: ActiveRole) => void;
  syncActiveRoleForUser: (userRole: UserRole | null) => void;
  canSwitchRole: boolean;
}

const ActiveRoleContext = createContext<ActiveRoleContextValue | undefined>(undefined);

export function ActiveRoleProvider({ children }: { children: React.ReactNode }) {
  const [activeRole, setActiveRoleState] = useState<ActiveRole>(
    () => readStoredActiveRole() ?? "buyer"
  );
  const [canSwitchRole, setCanSwitchRole] = useState(false);

  const setActiveRole = useCallback((role: ActiveRole) => {
    setActiveRoleState(role);
    writeStoredActiveRole(role);
  }, []);

  const syncActiveRoleForUser = useCallback((userRole: UserRole | null) => {
    if (!userRole) {
      setCanSwitchRole(false);
      return;
    }

    setCanSwitchRole(userRole === "both");

    if (userRole === "both") {
      const stored = readStoredActiveRole();
      setActiveRoleState(stored ?? "buyer");
      return;
    }

    setActiveRoleState(getDefaultActiveRole(userRole));
  }, []);

  return (
    <ActiveRoleContext.Provider
      value={{ activeRole, setActiveRole, syncActiveRoleForUser, canSwitchRole }}
    >
      {children}
    </ActiveRoleContext.Provider>
  );
}

export function useActiveRole() {
  const ctx = useContext(ActiveRoleContext);
  if (!ctx) throw new Error("useActiveRole must be used within ActiveRoleProvider");
  return ctx;
}
