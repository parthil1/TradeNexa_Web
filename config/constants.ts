import type { UserRole } from "@/types/auth";

/** Default language_id from Postman collection (e.g. English) */
export const DEFAULT_LANGUAGE_ID = Number(process.env.NEXT_PUBLIC_LANGUAGE_ID) || 4;

/** Role IDs — confirm with backend; Postman sample uses role_id: 5 */
export const API_ROLE_IDS: Record<UserRole, number> = {
  seller: Number(process.env.NEXT_PUBLIC_ROLE_ID_SELLER) || 3,
  buyer: Number(process.env.NEXT_PUBLIC_ROLE_ID_BUYER) || 4,
  both: Number(process.env.NEXT_PUBLIC_ROLE_ID_BOTH) || 5,
};

export const WEB_DEVICE = {
  device_type: "web" as const,
  device_token: process.env.NEXT_PUBLIC_DEVICE_TOKEN || "web-browser",
};
