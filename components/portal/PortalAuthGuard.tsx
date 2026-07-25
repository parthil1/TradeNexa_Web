"use client";

import React, { useEffect } from "react";
import dynamic from "next/dynamic";
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

const AuthModal = dynamic(() => import("@/components/AuthModal"), { ssr: false });
const CompleteProfileModal = dynamic(() => import("@/components/CompleteProfileModal"), {
  ssr: false,
});

export default function PortalAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, loading } = useAuth();
  const { syncActiveRoleForUser } = useActiveRole();

  useEffect(() => {
    if (loading) return;

    // Never bounce FCM deep-links to marketing "/" while session is still hydrating.
    if (!isAuthenticated || !user) {
      const hasToken =
        typeof window !== "undefined" && Boolean(localStorage.getItem("token"));
      if (hasToken) return;
      router.replace("/");
      return;
    }

    const portal = getPortalForPath(pathname);

    // Dual-role: URL portal wins (FCM / bookmarks). Single-role: forced to account side.
    syncActiveRoleForUser(user.role, portal);

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
  ]);

  if (loading || !isAuthenticated || !user) {
    const hasToken =
      typeof window !== "undefined" && Boolean(localStorage.getItem("token"));
    if (!loading && !hasToken) {
      return null;
    }
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
