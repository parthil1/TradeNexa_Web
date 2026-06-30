export type UserRole = "seller" | "buyer" | "both";

export interface User {
  id: string;
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
  company: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  role: UserRole;
}

export interface RegisterResponse {
  is_registered: boolean;
  access_token?: string;
  refresh_token?: string;
  user?: User;
  message?: string;
}
