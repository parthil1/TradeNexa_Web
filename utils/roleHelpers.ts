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

let roleIdByUserRole: Partial<Record<UserRole, number>> = {};
let userRoleById: Record<number, UserRole> = {};
let cachedApiRoles: ApiRole[] = [];
let loadPromise: Promise<void> | null = null;

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
  cachedApiRoles = roles.filter((role) => role.is_active);

  for (const role of cachedApiRoles) {
    const userRole = apiCodeToUserRole(role.code);
    if (userRole) {
      roleIdByUserRole[userRole] = role.id;
      userRoleById[role.id] = userRole;
    }
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
  return cachedApiRoles;
}

export function userRoleToRoleId(role: UserRole): number {
  return roleIdByUserRole[role] ?? FALLBACK_ROLE_IDS[role];
}

export function roleIdToUserRole(roleId: number): UserRole | null {
  return userRoleById[roleId] ?? null;
}

export function areRolesLoaded(): boolean {
  return Object.keys(roleIdByUserRole).length >= 3;
}

export async function ensureRolesLoaded(): Promise<RegisterableRoleOption[]> {
  if (!areRolesLoaded()) {
    if (!loadPromise) {
      loadPromise = fetchRoles()
        .then((roles) => {
          setRolesFromApi(roles);
        })
        .catch(() => {
          loadPromise = null;
        });
    }

    await loadPromise;
  }

  return getRegisterableRoles();
}

export function parseUserRole(role: unknown, roleId?: number | null): UserRole {
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
