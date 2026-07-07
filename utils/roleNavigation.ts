import type { UserRole } from "@/types/auth";

export type ActiveRole = "buyer" | "seller";

export const ACTIVE_ROLE_STORAGE_KEY = "tradenexa_active_role";

export function isPortalPath(pathname: string): boolean {
  return pathname.startsWith("/buyer") || pathname.startsWith("/seller");
}

export function getPortalForPath(pathname: string): ActiveRole | null {
  if (pathname.startsWith("/buyer")) return "buyer";
  if (pathname.startsWith("/seller")) return "seller";
  return null;
}

export function canAccessBuyerPortal(role: UserRole): boolean {
  return role === "buyer" || role === "both";
}

export function canAccessSellerPortal(role: UserRole): boolean {
  return role === "seller" || role === "both";
}

export function getHomePathForRole(role: UserRole): string {
  if (role === "seller") return "/seller/dashboard";
  return "/buyer/home";
}

export function getDefaultActiveRole(role: UserRole): ActiveRole {
  if (role === "seller") return "seller";
  return "buyer";
}

export function getDashboardPathForRole(role: UserRole): string {
  if (role === "both") {
    const stored = readStoredActiveRole();
    if (stored === "seller") return "/seller/dashboard";
    return "/buyer/home";
  }
  return getHomePathForRole(role);
}

export function readStoredActiveRole(): ActiveRole | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(ACTIVE_ROLE_STORAGE_KEY);
  return stored === "buyer" || stored === "seller" ? stored : null;
}

export function writeStoredActiveRole(role: ActiveRole): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVE_ROLE_STORAGE_KEY, role);
}
