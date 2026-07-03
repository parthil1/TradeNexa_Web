/** Direct backend API — set NEXT_PUBLIC_API_BASE_URL to override per environment */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://tradenexabackend-production.up.railway.app/api/v1";

/** Backend origin without /api/v1 (for media proxy) */
export const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
