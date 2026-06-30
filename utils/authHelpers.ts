import type { User, UserRole } from "@/types/auth";
import { API_ROLE_IDS } from "@/config/constants";

export function userRoleToRoleId(role: UserRole): number {
  return API_ROLE_IDS[role];
}

export function parseUserRole(role: unknown): UserRole {
  if (role === "seller" || role === "buyer" || role === "both") return role;
  return "buyer";
}

export function formatMobileNumber(countryCode: string, phone: string): string {
  const code = countryCode.startsWith("+") ? countryCode : `+${countryCode}`;
  return `${code}${phone.replace(/\D/g, "")}`;
}

export function extractPhoneFromMobile(mobileNumber: string): string {
  const digits = mobileNumber.replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export function extractCountryCode(mobileNumber: string): string {
  const digits = mobileNumber.replace(/\D/g, "");
  if (digits.length > 10) {
    return `+${digits.slice(0, digits.length - 10)}`;
  }
  return "+91";
}

export interface ApiAddress {
  address_line_1?: string | null;
  address_line_2?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;
}

export interface ApiUserProfile {
  uuid?: string;
  id?: string | number;
  full_name?: string | null;
  company_name?: string | null;
  mobile_number?: string | null;
  email?: string | null;
  role?: string | null;
  role_id?: number | null;
  address?: ApiAddress | string | null;
  city?: string | null;
}

export interface ApiAuthSession {
  is_registered: boolean;
  access_token?: string;
  refresh_token?: string;
  user?: User;
}

/** API wraps payloads in { success, message, data } */
export function unwrapApiPayload<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

export function mapApiProfileToUser(profile: ApiUserProfile): User {
  const mobile = String(profile.mobile_number || "");
  const addressObj =
    profile.address && typeof profile.address === "object" ? profile.address : null;

  return {
    id: String(profile.uuid ?? profile.id ?? ""),
    name: String(profile.full_name ?? ""),
    company: String(profile.company_name ?? ""),
    email: profile.email ? String(profile.email) : "",
    address: String(
      addressObj?.address_line_1 ??
        (typeof profile.address === "string" ? profile.address : "")
    ),
    city: String(profile.city ?? ""),
    state: String(addressObj?.state ?? ""),
    pincode: String(addressObj?.pincode ?? ""),
    role: parseUserRole(profile.role),
    phone: extractPhoneFromMobile(mobile),
    country_code: extractCountryCode(mobile),
  };
}

export function parseAuthSession(data: Record<string, unknown>): ApiAuthSession {
  const access_token = getAccessToken(data);
  const refresh_token = getRefreshToken(data);
  const userRecord = data.user as ApiUserProfile | undefined;

  return {
    is_registered: data.is_registered === true,
    access_token,
    refresh_token,
    user: userRecord ? mapApiProfileToUser(userRecord) : undefined,
  };
}

export function getAccessToken(data: Record<string, unknown>): string | undefined {
  return (
    (data.access_token as string | undefined) ||
    (data.token as string | undefined)
  );
}

export function getRefreshToken(data: Record<string, unknown>): string | undefined {
  return data.refresh_token as string | undefined;
}

export function getFirebaseVerificationId(data: Record<string, unknown>): string | undefined {
  return data.firebase_verification_id as string | undefined;
}

export function getMobileNumber(data: Record<string, unknown>): string | undefined {
  return data.mobile_number as string | undefined;
}
