import type { ReactNode } from "react";
import { portalProductGridClass } from "@/components/portal/portalLayout";

interface PortalProductGridProps {
  children: ReactNode;
  className?: string;
}

export default function PortalProductGrid({ children, className = "" }: PortalProductGridProps) {
  return <div className={`${portalProductGridClass} ${className}`.trim()}>{children}</div>;
}
