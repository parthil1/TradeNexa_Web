export const API_ENDPOINTS = {
  SEND_OTP: "/auth/send-otp",
  VERIFY_OTP: "/auth/verify-otp",
  REGISTER: "/auth/register",
  REFRESH_TOKEN: "/auth/refresh-token",
  LOGOUT: "/auth/logout",
  PROFILE: "/auth/profile",
  ROLES: "/roles",
  BUSINESS_TYPES: "/business-types",
  CATEGORIES: "/categories",
  PRODUCTS: "/products",
  BRANDS: "/brands",
  BANNERS: "/banners",
} as const;
