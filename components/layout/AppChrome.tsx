"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  AppChromeVisibilityProvider,
  useAppChromeVisibility,
} from "@/components/layout/AppChromeVisibility";
import { isPortalPath } from "@/utils/roleNavigation";

function AppChromeInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const portal = isPortalPath(pathname);
  const { hideChrome } = useAppChromeVisibility();

  if (portal || hideChrome) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main className="min-w-0 flex-1 pt-[var(--header-height)]">{children}</main>
      <Footer />
    </>
  );
}

export default function AppChrome({ children }: { children: React.ReactNode }) {
  return (
    <AppChromeVisibilityProvider>
      <AppChromeInner>{children}</AppChromeInner>
    </AppChromeVisibilityProvider>
  );
}
