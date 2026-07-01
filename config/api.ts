/**
 * Client calls same-origin `/api/v1` — Next.js rewrites proxy to Railway backend (avoids CORS).
 * Set API_PROXY_TARGET on Vercel to your backend URL (default: tradenexabackend-production.up.railway.app).
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1";
