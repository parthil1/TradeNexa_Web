"use client";

import React, {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";

interface AppChromeVisibilityValue {
  hideChrome: boolean;
  setHideChrome: (hide: boolean) => void;
}

const AppChromeVisibilityContext = createContext<AppChromeVisibilityValue | null>(null);

export function AppChromeVisibilityProvider({ children }: { children: React.ReactNode }) {
  const [hideChrome, setHideChrome] = useState(false);
  const value = useMemo(
    () => ({ hideChrome, setHideChrome }),
    [hideChrome]
  );
  return (
    <AppChromeVisibilityContext.Provider value={value}>
      {children}
    </AppChromeVisibilityContext.Provider>
  );
}

export function useAppChromeVisibility(): AppChromeVisibilityValue {
  const ctx = useContext(AppChromeVisibilityContext);
  if (!ctx) {
    throw new Error("useAppChromeVisibility must be used within AppChromeVisibilityProvider");
  }
  return ctx;
}

/** Call from not-found (and similar) pages so Navbar/Footer are omitted. */
export function HideAppChrome() {
  const { setHideChrome } = useAppChromeVisibility();
  useLayoutEffect(() => {
    setHideChrome(true);
    return () => setHideChrome(false);
  }, [setHideChrome]);
  return null;
}
