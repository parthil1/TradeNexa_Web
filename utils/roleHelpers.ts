import type { UserRole } from "@/types/auth";
import type { ApiRole } from "@/types/roles";
import { fetchRoles } from "@/services/rolesService";

const REGISTERABLE_ROLE_CODES: Record<UserRole, string> = {
  buyer: "buyer",
  seller: "seller",
  both: "buyer_seller",
};

const FALLBACK_ROLE_IDS: Record<UserRole, number> = {
  buyer: 1,
  seller: 2,
  both: 3,
};

/** Static roles used for registration / account type selection. */
export const STATIC_API_ROLES: ApiRole[] = [
  {
    id: 3,
    code: "buyer_seller",
    name: "Buyer + Seller",
    description: "User who buys and sells products",
    is_active: 1,
    created_at: "2026-07-01T17:47:10.000Z",
    updated_at: "2026-07-01T17:47:10.000Z",
  },
  {
    id: 2,
    code: "seller",
    name: "Seller",
    description: "User who sells products",
    is_active: 1,
    created_at: "2026-07-01T17:47:10.000Z",
    updated_at: "2026-07-01T17:47:10.000Z",
  },
  {
    id: 1,
    code: "buyer",
    name: "Buyer",
    description: "User who purchases products",
    is_active: 1,
    created_at: "2026-07-01T17:47:10.000Z",
    updated_at: "2026-07-01T17:47:10.000Z",
  },
];

let roleIdByUserRole: Partial<Record<UserRole, number>> = {};
let userRoleById: Record<number, UserRole> = {};
let cachedApiRoles: ApiRole[] = [];
let loadPromise: Promise<void> | null = null;
let rolesInitialized = false;

const REGISTERABLE_ROLE_ORDER: UserRole[] = ["seller", "buyer", "both"];

export function apiCodeToUserRole(code: string): UserRole | null {
  if (code === "buyer") return "buyer";
  if (code === "seller") return "seller";
  if (code === "buyer_seller") return "both";
  return null;
}

export function userRoleToApiCode(role: UserRole): string {
  return REGISTERABLE_ROLE_CODES[role];
}

export function setRolesFromApi(roles: ApiRole[]): void {
  roleIdByUserRole = {};
  userRoleById = {};
  cachedApiRoles = roles.filter((role) => Boolean(role.is_active));

  for (const role of cachedApiRoles) {
    const userRole = apiCodeToUserRole(role.code);
    if (userRole) {
      roleIdByUserRole[userRole] = role.id;
      userRoleById[role.id] = userRole;
    }
  }

  rolesInitialized = Object.keys(roleIdByUserRole).length >= 3;
}

function ensureStaticRoles(): void {
  if (!rolesInitialized) {
    setRolesFromApi(STATIC_API_ROLES);
  }
}

export interface RegisterableRoleOption {
  id: number;
  code: string;
  name: string;
  description: string;
  userRole: UserRole;
}

export function getRegisterableRoles(): RegisterableRoleOption[] {
  ensureStaticRoles();

  return cachedApiRoles
    .map((role) => {
      const userRole = apiCodeToUserRole(role.code);
      if (!userRole) return null;
      return {
        id: role.id,
        code: role.code,
        name: role.name,
        description: role.description,
        userRole,
      };
    })
    .filter((role): role is RegisterableRoleOption => role !== null)
    .sort(
      (a, b) =>
        REGISTERABLE_ROLE_ORDER.indexOf(a.userRole) -
        REGISTERABLE_ROLE_ORDER.indexOf(b.userRole)
    );
}

export function getAllRolesFromCache(): ApiRole[] {
  ensureStaticRoles();
  return cachedApiRoles;
}

export function userRoleToRoleId(role: UserRole): number {
  ensureStaticRoles();
  return roleIdByUserRole[role] ?? FALLBACK_ROLE_IDS[role];
}

export function roleIdToUserRole(roleId: number): UserRole | null {
  ensureStaticRoles();
  return userRoleById[roleId] ?? null;
}

export function areRolesLoaded(): boolean {
  return Object.keys(roleIdByUserRole).length >= 3;
}

export async function ensureRolesLoaded(): Promise<RegisterableRoleOption[]> {
  ensureStaticRoles();

  if (!loadPromise) {
    loadPromise = fetchRoles()
      .then((roles) => {
        const activeRegisterable = roles.filter((role) => {
          if (!role.is_active) return false;
          return apiCodeToUserRole(role.code) !== null;
        });

        if (activeRegisterable.length >= 3) {
          setRolesFromApi(activeRegisterable);
        } else {
          setRolesFromApi(STATIC_API_ROLES);
        }
      })
      .catch(() => {
        setRolesFromApi(STATIC_API_ROLES);
        loadPromise = null;
      });
  }

  try {
    await loadPromise;
  } catch {
    setRolesFromApi(STATIC_API_ROLES);
  }

  return getRegisterableRoles();
}

export function parseUserRole(role: unknown, roleId?: number | null): UserRole {
  ensureStaticRoles();

  if (roleId != null) {
    const fromId = roleIdToUserRole(roleId);
    if (fromId) return fromId;
  }

  if (typeof role === "string") {
    const fromCode = apiCodeToUserRole(role);
    if (fromCode) return fromCode;
    if (role === "seller" || role === "buyer" || role === "both") return role;
  }

  return "buyer";
}
