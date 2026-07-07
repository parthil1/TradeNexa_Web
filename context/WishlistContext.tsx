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
import { readWishlistIds, writeWishlistIds } from "@/utils/wishlistStorage";

interface WishlistContextValue {
  wishlistedIds: number[];
  isWishlisted: (productId: number) => boolean;
  toggleWishlist: (productId: number) => void;
  addToWishlist: (productId: number) => void;
  removeFromWishlist: (productId: number) => void;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlistedIds, setWishlistedIds] = useState<number[]>(readWishlistIds);

  useEffect(() => {
    writeWishlistIds(wishlistedIds);
  }, [wishlistedIds]);

  const isWishlisted = useCallback(
    (productId: number) => wishlistedIds.includes(productId),
    [wishlistedIds]
  );

  const toggleWishlist = useCallback((productId: number) => {
    setWishlistedIds((prev) => {
      const exists = prev.includes(productId);
      return exists ? prev.filter((id) => id !== productId) : [...prev, productId];
    });
  }, []);

  const addToWishlist = useCallback((productId: number) => {
    setWishlistedIds((prev) => (prev.includes(productId) ? prev : [...prev, productId]));
  }, []);

  const removeFromWishlist = useCallback((productId: number) => {
    setWishlistedIds((prev) => {
      if (!prev.includes(productId)) return prev;
      return prev.filter((id) => id !== productId);
    });
  }, []);

  const value = useMemo(
    () => ({
      wishlistedIds,
      isWishlisted,
      toggleWishlist,
      addToWishlist,
      removeFromWishlist,
    }),
    [wishlistedIds, isWishlisted, toggleWishlist, addToWishlist, removeFromWishlist]
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
