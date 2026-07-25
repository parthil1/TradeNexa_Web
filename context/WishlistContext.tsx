"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  useGetWishlistQuery,
  useToggleWishlistMutation,
} from "@/store/api/wishlistApi";
import type { ApiProductListItem } from "@/types/catalog";
import { showErrorToast } from "@/utils/toast";

interface WishlistContextValue {
  wishlistedIds: number[];
  wishlistTotal: number;
  isWishlisted: (productId: number, fromProduct?: boolean) => boolean;
  toggleWishlist: (productId: number, currentlyWishlisted?: boolean) => Promise<void>;
  addToWishlist: (productId: number) => void;
  removeFromWishlist: (productId: number) => Promise<void>;
  syncFromProducts: (products: ApiProductListItem[], total?: number) => void;
  clearWishlist: () => void;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

/**
 * Keeps a local optimistic overlay on top of the RTK Query wishlist cache so
 * hearts flip instantly while the mutation is in flight. The cache remains the
 * source of truth after invalidation settles.
 */
export function WishlistProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [overlay, setOverlay] = useState<Record<number, boolean>>({});
  const [overlayTotalDelta, setOverlayTotalDelta] = useState(0);

  const { data, refetch } = useGetWishlistQuery(
    { page: 1, limit: 100 },
    { skip: authLoading || !isAuthenticated }
  );
  const [toggleWishlistMutation] = useToggleWishlistMutation();

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setOverlay({});
      setOverlayTotalDelta(0);
    }
  }, [authLoading, isAuthenticated]);

  // When the server cache refreshes, drop overlays that now match it.
  useEffect(() => {
    if (!data) return;
    const serverIds = new Set(data.results.map((p) => p.id));
    setOverlay((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const [idStr, want] of Object.entries(prev)) {
        const id = Number(idStr);
        const onServer = serverIds.has(id);
        if (want === onServer) {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    setOverlayTotalDelta(0);
  }, [data]);

  const baseMap = useMemo(() => {
    const map: Record<number, boolean> = {};
    for (const product of data?.results ?? []) {
      map[product.id] = true;
    }
    return map;
  }, [data]);

  const wishlistMap = useMemo(() => ({ ...baseMap, ...overlay }), [baseMap, overlay]);

  const wishlistTotal = Math.max(0, (data?.total ?? 0) + overlayTotalDelta);

  const refreshWishlist = useCallback(async () => {
    if (authLoading || !isAuthenticated) {
      setOverlay({});
      setOverlayTotalDelta(0);
      return;
    }
    await refetch();
  }, [authLoading, isAuthenticated, refetch]);

  const isWishlisted = useCallback(
    (productId: number, fromProduct?: boolean) => {
      if (productId in wishlistMap) {
        return wishlistMap[productId];
      }
      return fromProduct === true;
    },
    [wishlistMap]
  );

  const toggleWishlist = useCallback(
    async (productId: number, currentlyWishlisted?: boolean) => {
      const previous =
        currentlyWishlisted ?? (productId in wishlistMap ? wishlistMap[productId] : false);

      setOverlay((prev) => ({ ...prev, [productId]: !previous }));
      setOverlayTotalDelta((delta) => delta + (previous ? -1 : 1));

      try {
        const isWishlist = await toggleWishlistMutation({
          productId,
          currentlyWishlisted: previous,
        }).unwrap();
        setOverlay((prev) => ({ ...prev, [productId]: isWishlist }));
      } catch (err) {
        setOverlay((prev) => ({ ...prev, [productId]: previous }));
        setOverlayTotalDelta((delta) => delta + (previous ? 1 : -1));
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message: string }).message)
            : "Failed to update wishlist";
        showErrorToast(message);
      }
    },
    [toggleWishlistMutation, wishlistMap]
  );

  const addToWishlist = useCallback((productId: number) => {
    setOverlay((prev) => ({ ...prev, [productId]: true }));
  }, []);

  const removeFromWishlist = useCallback(
    async (productId: number) => {
      if (wishlistMap[productId] === false) return;
      const previous = wishlistMap[productId] ?? true;

      setOverlay((prev) => ({ ...prev, [productId]: false }));
      setOverlayTotalDelta((delta) => delta - 1);

      try {
        await toggleWishlistMutation({
          productId,
          currentlyWishlisted: previous,
        }).unwrap();
        // Tag invalidation refetches the shared cache — no manual refresh.
      } catch (err) {
        setOverlay((prev) => ({ ...prev, [productId]: previous }));
        setOverlayTotalDelta((delta) => delta + 1);
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message: string }).message)
            : "Failed to update wishlist";
        showErrorToast(message);
      }
    },
    [toggleWishlistMutation, wishlistMap]
  );

  const syncFromProducts = useCallback((products: ApiProductListItem[], _total?: number) => {
    setOverlay((prev) => {
      const next = { ...prev };
      for (const product of products) {
        if (product.is_wishlist === true) {
          next[product.id] = true;
        }
      }
      return next;
    });
  }, []);

  const clearWishlist = useCallback(() => {
    setOverlay({});
    setOverlayTotalDelta(0);
  }, []);

  const wishlistedIds = useMemo(
    () => Object.entries(wishlistMap).filter(([, v]) => v).map(([id]) => Number(id)),
    [wishlistMap]
  );

  const value = useMemo(
    () => ({
      wishlistedIds,
      wishlistTotal,
      isWishlisted,
      toggleWishlist,
      addToWishlist,
      removeFromWishlist,
      syncFromProducts,
      clearWishlist,
      refreshWishlist,
    }),
    [
      wishlistedIds,
      wishlistTotal,
      isWishlisted,
      toggleWishlist,
      addToWishlist,
      removeFromWishlist,
      syncFromProducts,
      clearWishlist,
      refreshWishlist,
    ]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlistContext() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error("useWishlistContext must be used within WishlistProvider");
  }
  return ctx;
}
