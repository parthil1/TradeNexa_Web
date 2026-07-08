"use client";

import { useCallback } from "react";
import { usePathname } from "next/navigation";
import { useWishlistContext } from "@/context/WishlistContext";
import { useAuth } from "@/hooks/useAuth";
import { isPortalPath } from "@/utils/roleNavigation";

export function useWishlist() {
  const ctx = useWishlistContext();
  const { isAuthenticated, openAuthModal } = useAuth();
  const pathname = usePathname() ?? "";
  const onWebsite = !isPortalPath(pathname);

  const toggleWishlist = useCallback(
    (productId: number) => {
      if (onWebsite && !isAuthenticated) {
        openAuthModal("login");
        return;
      }
      ctx.toggleWishlist(productId);
    },
    [ctx, onWebsite, isAuthenticated, openAuthModal]
  );

  return {
    ...ctx,
    toggleWishlist,
  };
}
