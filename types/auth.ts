export type UserRole = "seller" | "buyer" | "both";

export interface User {
  id: string;
  /** Numeric backend user id — used for chat sender ownership (sender_id). */
  user_id?: number | null;
  name: string;
  company: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  role: UserRole;
  phone: string;
  country_code: string;
}

export interface SendOtpResponse {
  firebase_verification_id: string;
  mobile_number: string;
  message?: string;
}

export interface VerifyOtpResponse {
  is_registered: boolean;
  access_token?: string;
  refresh_token?: string;
  user?: User;
  message?: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  role: UserRole;
  businessTypeId: number;
}

export interface CompleteProfileFormData {
  companyName: string;
  industry: string;
  gstNumber: string;
  address: string;
  country: string;
  panNumber: string;
  cinNumber: string;
  iecNumber: string;
  businessDescription: string;
  profileImageFile: File | null;
  companyLogoFile: File | null;
  companyBannerFile: File | null;
  /** Existing image URLs from GET /auth/profile (for edit-mode preview) */
  profileImageUrl?: string;
  companyLogoUrl?: string;
  companyBannerUrl?: string;
}

export type CompleteProfileData = {
  role: UserRole;
  data: CompleteProfileFormData;
};

export interface RegisterResponse {
  is_registered: boolean;
  access_token?: string;
  refresh_token?: string;
  user?: User;
  message?: string;
}
