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

/** Backend `buyer` / `buyer_seller` → frontend `buyer` | `both`. */
export function canAccessBuyerPortal(role: UserRole): boolean {
  return role === "buyer" || role === "both";
}

/** Backend `seller` / `buyer_seller` → frontend `seller` | `both`. */
export function canAccessSellerPortal(role: UserRole): boolean {
  return role === "seller" || role === "both";
}

export function canAccessPortal(accountRole: UserRole, portal: ActiveRole): boolean {
  return portal === "seller"
    ? canAccessSellerPortal(accountRole)
    : canAccessBuyerPortal(accountRole);
}

/**
 * Clamp marketplace active role to what the account can access.
 * Mirrors backend: buyer_seller may use either side; single-role cannot.
 */
export function clampActiveRole(
  accountRole: UserRole | null | undefined,
  desired: ActiveRole | null | undefined
): ActiveRole {
  if (!accountRole) {
    return desired === "seller" ? "seller" : "buyer";
  }
  if (accountRole === "both") {
    return desired === "seller" ? "seller" : "buyer";
  }
  return getDefaultActiveRole(accountRole);
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

/** Account capability from cached session user (`buyer` | `seller` | `both`). */
export function readStoredAccountRole(): UserRole | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { role?: unknown };
    if (parsed.role === "buyer" || parsed.role === "seller" || parsed.role === "both") {
      return parsed.role;
    }
  } catch {
    // ignore
  }
  return null;
}

export function writeStoredActiveRole(role: ActiveRole): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVE_ROLE_STORAGE_KEY, role);
}

/**
 * If a deep link targets a portal the account cannot access, fall back to home.
 * Dual-role (buyer_seller / both) keeps the original path.
 */
export function clampPortalPathForAccount(
  urlOrPath: string,
  accountRole?: UserRole | null
): string {
  const role = accountRole ?? readStoredAccountRole();
  if (!role || !urlOrPath) return urlOrPath;

  try {
    const isHttp = urlOrPath.startsWith("http");
    const parsed = isHttp ? new URL(urlOrPath) : null;
    const pathname = parsed
      ? parsed.pathname
      : urlOrPath.split("?")[0]?.split("#")[0] || "";
    const search = parsed
      ? parsed.search
      : urlOrPath.includes("?")
        ? `?${urlOrPath.split("?")[1]?.split("#")[0] || ""}`
        : "";
    const portal = getPortalForPath(pathname);
    if (!portal || canAccessPortal(role, portal)) {
      return urlOrPath;
    }
    return getHomePathForRole(role);
  } catch {
    return urlOrPath;
  }
}

/**
 * Align `tradenexa_active_role` with a portal URL (e.g. FCM deep link).
 * Clamps to the signed-in account capability (buyer / seller / both).
 */
export function applyActiveRoleForUrl(
  urlOrPath: string,
  accountRole?: UserRole | null
): ActiveRole | null {
  if (typeof window === "undefined") return null;
  try {
    const path = urlOrPath.startsWith("http")
      ? new URL(urlOrPath).pathname
      : urlOrPath.split("?")[0]?.split("#")[0] || "";
    const portal = getPortalForPath(path);
    if (!portal) return null;
    const role = clampActiveRole(accountRole ?? readStoredAccountRole(), portal);
    writeStoredActiveRole(role);
    return role;
  } catch {
    return null;
  }
}

/** Default FCM / deep-link chats path from `tradenexa_active_role`. */
export function getChatsPathForActiveRole(role?: ActiveRole | null): string {
  const resolved = role ?? readStoredActiveRole();
  return resolved === "seller" ? "/seller/chats" : "/buyer/chats";
}
