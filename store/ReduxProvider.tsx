"use client";

import React from "react";
import { Provider } from "react-redux";
import { makeStore, type AppStore } from "@/store";
import { hydrateFromGeoCache } from "@/store/slices/filtersSlice";

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  // Ref (not module singleton) so each SSR render gets a clean store and the
  // client keeps one stable instance across re-renders.
  const storeRef = React.useRef<AppStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
    // Client-only: seed city filter from geo cache before any catalog page mounts.
    if (typeof window !== "undefined") {
      storeRef.current.dispatch(hydrateFromGeoCache());
    }
  }

  return <Provider store={storeRef.current}>{children}</Provider>;
}
