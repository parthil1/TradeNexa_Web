import type { User, UserRole } from "@/types/auth";
import type { CompleteProfileFormData } from "@/types/auth";
import { parseUserRole } from "@/utils/roleHelpers";
import { resolveImageUrl } from "@/utils/catalogHelpers";

export { userRoleToRoleId, ensureRolesLoaded, parseUserRole } from "@/utils/roleHelpers";

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
  user_id?: number | null;
  full_name?: string | null;
  company_name?: string | null;
  mobile_number?: string | null;
  email?: string | null;
  role?: string | null;
  role_id?: number | null;
  is_completed_profile?: boolean | number | null;
  address?: ApiAddress | string | null;
  city?: string | null;
  seller_id?: number | null;
  seller?: { id?: number | null } | null;
  industry?: string | null;
  gst_number?: string | null;
  pan_number?: string | null;
  cin_number?: string | null;
  iec_number?: string | null;
  business_description?: string | null;
  profile_image?: string | null;
  company_logo?: string | null;
  company_banner?: string | null;
}

function profileCanSell(profile: ApiUserProfile): boolean {
  const role = typeof profile.role === "string" ? profile.role : "";
  if (role === "seller" || role === "buyer_seller") return true;
  if (profile.role_id === 2 || profile.role_id === 3) return true;
  return false;
}

function parsePositiveId(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
}

export function getSellerIdFromProfile(profile: ApiUserProfile): number | null {
  const direct = parsePositiveId(profile.seller_id);
  if (direct) return direct;

  const nested = parsePositiveId(profile.seller?.id);
  if (nested) return nested;

  // Backend profile often omits seller_id; for seller / buyer_seller roles user_id
  // matches the seller record id (e.g. GET /sellers → id: 11 for user_id: 11).
  if (profileCanSell(profile)) {
    return parsePositiveId(profile.user_id) ?? parsePositiveId(profile.id);
  }

  return null;
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
    role: parseUserRole(profile.role, profile.role_id),
    phone: extractPhoneFromMobile(mobile),
    country_code: extractCountryCode(mobile),
  };
}

export function mapProfileToCompleteProfileForm(profile: ApiUserProfile): CompleteProfileFormData {
  const addressObj =
    profile.address && typeof profile.address === "object" ? profile.address : null;

  return {
    companyName: String(profile.company_name ?? ""),
    industry: String(profile.industry ?? ""),
    gstNumber: String(profile.gst_number ?? ""),
    address: String(
      addressObj?.address_line_1 ??
        (typeof profile.address === "string" ? profile.address : "")
    ),
    country: String(addressObj?.country ?? "India"),
    panNumber: String(profile.pan_number ?? ""),
    cinNumber: String(profile.cin_number ?? ""),
    iecNumber: String(profile.iec_number ?? ""),
    businessDescription: String(profile.business_description ?? ""),
    profileImageFile: null,
    companyLogoFile: null,
    companyBannerFile: null,
    profileImageUrl: resolveImageUrl(profile.profile_image) ?? "",
    companyLogoUrl: resolveImageUrl(profile.company_logo) ?? "",
    companyBannerUrl: resolveImageUrl(profile.company_banner) ?? "",
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
