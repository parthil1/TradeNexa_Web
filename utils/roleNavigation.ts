import type { UserRole } from "@/types/auth";

export type ActiveRole = "buyer" | "seller";

export const ACTIVE_ROLE_STORAGE_KEY = "tradenexa_active_role";

export function isPortalPath(pathname: string): boolean {
  return (
    pathname === "/buyer" ||
    pathname.startsWith("/buyer/") ||
    pathname === "/seller" ||
    pathname.startsWith("/seller/")
  );
}

export function getPortalForPath(pathname: string): ActiveRole | null {
  if (pathname === "/buyer" || pathname.startsWith("/buyer/")) return "buyer";
  if (pathname === "/seller" || pathname.startsWith("/seller/")) return "seller";
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

/**
 * Align `tradenexa_active_role` with a portal URL (e.g. FCM deep link).
 * Returns the portal role when the path is under /buyer or /seller.
 */
export function applyActiveRoleForUrl(urlOrPath: string): ActiveRole | null {
  if (typeof window === "undefined") return null;
  try {
    const path = urlOrPath.startsWith("http")
      ? new URL(urlOrPath).pathname
      : urlOrPath.split("?")[0]?.split("#")[0] || "";
    const portal = getPortalForPath(path);
    if (!portal) return null;
    writeStoredActiveRole(portal);
    return portal;
  } catch {
    return null;
  }
}

/** Default FCM / deep-link chats path from `tradenexa_active_role`. */
export function getChatsPathForActiveRole(role?: ActiveRole | null): string {
  const resolved = role ?? readStoredActiveRole();
  return resolved === "seller" ? "/seller/chats" : "/buyer/chats";
}
