"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { UserRole } from "@/types/auth";
import {
  type ActiveRole,
  getDefaultActiveRole,
  readStoredActiveRole,
  writeStoredActiveRole,
} from "@/utils/roleNavigation";
import { syncActiveRoleToServiceWorker } from "@/services/fcmService";

interface ActiveRoleContextValue {
  activeRole: ActiveRole;
  setActiveRole: (role: ActiveRole) => void;
  syncActiveRoleForUser: (userRole: UserRole | null) => void;
  canSwitchRole: boolean;
}

const ActiveRoleContext = createContext<ActiveRoleContextValue | undefined>(undefined);

export function ActiveRoleProvider({ children }: { children: React.ReactNode }) {
  const [activeRole, setActiveRoleState] = useState<ActiveRole>("buyer");
  const [canSwitchRole, setCanSwitchRole] = useState(false);

  useEffect(() => {
    const stored = readStoredActiveRole();
    if (stored) setActiveRoleState(stored);
  }, []);

  const setActiveRole = useCallback((role: ActiveRole) => {
    setActiveRoleState(role);
    writeStoredActiveRole(role);
    syncActiveRoleToServiceWorker(role);
  }, []);

  const syncActiveRoleForUser = useCallback((userRole: UserRole | null) => {
    if (!userRole) {
      setCanSwitchRole(false);
      return;
    }

    setCanSwitchRole(userRole === "both");

    if (userRole === "both") {
      const stored = readStoredActiveRole() ?? "buyer";
      setActiveRoleState(stored);
      syncActiveRoleToServiceWorker(stored);
      return;
    }

    const role = getDefaultActiveRole(userRole);
    setActiveRoleState(role);
    writeStoredActiveRole(role);
    syncActiveRoleToServiceWorker(role);
  }, []);

  const value = useMemo(
    () => ({ activeRole, setActiveRole, syncActiveRoleForUser, canSwitchRole }),
    [activeRole, setActiveRole, syncActiveRoleForUser, canSwitchRole]
  );

  return (
    <ActiveRoleContext.Provider value={value}>{children}</ActiveRoleContext.Provider>
  );
}

export function useActiveRole() {
  const ctx = useContext(ActiveRoleContext);
  if (!ctx) throw new Error("useActiveRole must be used within ActiveRoleProvider");
  return ctx;
}
