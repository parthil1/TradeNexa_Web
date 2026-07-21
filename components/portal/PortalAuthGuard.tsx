"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useActiveRole } from "@/context/ActiveRoleContext";
import {
  canAccessBuyerPortal,
  canAccessSellerPortal,
  getHomePathForRole,
  getPortalForPath,
} from "@/utils/roleNavigation";
import AuthModal from "@/components/AuthModal";
import CompleteProfileModal from "@/components/CompleteProfileModal";

export default function PortalAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, loading } = useAuth();
  const { syncActiveRoleForUser, setActiveRole, activeRole } = useActiveRole();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated || !user) {
      router.replace("/");
      return;
    }

    const portal = getPortalForPath(pathname);

    // Always sync so buyer_seller gets canSwitchRole=true (shows Switch Role UI)
    // even when the URL already matches the stored activeRole.
    syncActiveRoleForUser(user.role);

    // buyer_seller: URL portal wins so FCM deep links switch role before any redirect.
    if (user.role === "both" && portal && portal !== activeRole) {
      setActiveRole(portal);
    }

    if (portal === "buyer" && !canAccessBuyerPortal(user.role)) {
      router.replace(getHomePathForRole(user.role));
      return;
    }
    if (portal === "seller" && !canAccessSellerPortal(user.role)) {
      router.replace(getHomePathForRole(user.role));
    }
  }, [
    loading,
    isAuthenticated,
    user,
    pathname,
    router,
    syncActiveRoleForUser,
    setActiveRole,
    activeRole,
  ]);

  if (loading || !isAuthenticated || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const portal = getPortalForPath(pathname);
  if (portal === "buyer" && !canAccessBuyerPortal(user.role)) return null;
  if (portal === "seller" && !canAccessSellerPortal(user.role)) return null;

  return (
    <>
      {children}
      <AuthModal />
      <CompleteProfileModal />
    </>
  );
}