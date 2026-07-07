"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { isPortalPath } from "@/utils/roleNavigation";

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const portal = isPortalPath(pathname);

  if (portal) {
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
