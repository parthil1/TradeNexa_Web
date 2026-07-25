"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { UserRole } from "@/types/auth";
import { useAuth } from "@/hooks/useAuth";
import {
  type ActiveRole,
  clampActiveRole,
  getDefaultActiveRole,
  readStoredActiveRole,
  writeStoredActiveRole,
} from "@/utils/roleNavigation";
import { syncActiveRoleToServiceWorker } from "@/services/fcmService";

interface ActiveRoleContextValue {
  activeRole: ActiveRole;
  setActiveRole: (role: ActiveRole) => void;
  /**
   * Align portal mode with account capability.
   * For buyer_seller (`both`), `preferredPortal` (URL / FCM) wins over storage.
   */
  syncActiveRoleForUser: (
    userRole: UserRole | null,
    preferredPortal?: ActiveRole | null
  ) => void;
  canSwitchRole: boolean;
}

const ActiveRoleContext = createContext<ActiveRoleContextValue | undefined>(
  undefined
);

export function ActiveRoleProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [activeRole, setActiveRoleState] = useState<ActiveRole>("buyer");
  const [canSwitchRole, setCanSwitchRole] = useState(false);

  const setActiveRole = useCallback(
    (role: ActiveRole) => {
      const next = clampActiveRole(user?.role, role);
      setActiveRoleState(next);
      writeStoredActiveRole(next);
      syncActiveRoleToServiceWorker(next);
    },
    [user?.role]
  );

  const syncActiveRoleForUser = useCallback(
    (userRole: UserRole | null, preferredPortal?: ActiveRole | null) => {
      if (!userRole) {
        setCanSwitchRole(false);
        return;
      }

      setCanSwitchRole(userRole === "both");

      if (userRole === "both") {
        const next = clampActiveRole(
          userRole,
          preferredPortal ?? readStoredActiveRole() ?? "buyer"
        );
        setActiveRoleState(next);
        writeStoredActiveRole(next);
        syncActiveRoleToServiceWorker(next);
        return;
      }

      const role = getDefaultActiveRole(userRole);
      setActiveRoleState(role);
      writeStoredActiveRole(role);
      syncActiveRoleToServiceWorker(role);
    },
    []
  );

  // Keep active role / SW cache aligned whenever the signed-in account changes.
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setCanSwitchRole(false);
      return;
    }
    syncActiveRoleForUser(user.role);
  }, [isAuthenticated, user, syncActiveRoleForUser]);

  // Initial hydrate from storage before auth finishes (FCM deep-link race).
  useEffect(() => {
    const stored = readStoredActiveRole();
    if (stored) setActiveRoleState(stored);
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
