import type { UserRole } from "@/types/auth";

/** Default language_id for registration (e.g. 4 = English) */
export const DEFAULT_LANGUAGE_ID =
  Number(process.env.NEXT_PUBLIC_LANGUAGE_ID) || 4;

/** Role IDs — confirm with backend */
export const API_ROLE_IDS: Record<UserRole, number> = {
  seller: Number(process.env.NEXT_PUBLIC_ROLE_ID_SELLER) || 3,
  buyer: Number(process.env.NEXT_PUBLIC_ROLE_ID_BUYER) || 4,
  both: Number(process.env.NEXT_PUBLIC_ROLE_ID_BOTH) || 5,
};

/** Device payload for register API */
export const REGISTER_DEVICE = {
  device_type: process.env.NEXT_PUBLIC_DEVICE_TYPE || "android",
  device_token: process.env.NEXT_PUBLIC_DEVICE_TOKEN || "firebase_device_token",
};
