/**
 * Client calls the Railway backend directly (no Next.js proxy).
 * Set NEXT_PUBLIC_API_BASE_URL to override the default origin + /api/v1 path.
 */
export const BACKEND_ORIGIN = (
  process.env.NEXT_PUBLIC_BACKEND_ORIGIN?.trim() ||
  process.env.API_PROXY_TARGET?.trim() ||
  "https://tradenexabackend-production.up.railway.app"
).replace(/\/$/, "");

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || `${BACKEND_ORIGIN}/api/v1`;
