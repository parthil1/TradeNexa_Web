import type { PaginatedResult } from "@/types/catalog";
import { API_BASE_URL, BACKEND_ORIGIN } from "@/config/api";

function proxyBackendMediaUrl(url: URL): string | null {
  const backendHost = new URL(BACKEND_ORIGIN).host;
  if (url.host !== backendHost) return null;
  if (!url.pathname.startsWith("/media/")) return null;
  const mediaPath = url.pathname.slice("/media/".length);
  return mediaPath ? `/api/media/${mediaPath}` : null;
}

/**
 * Resolves API image URLs for use in <img> tags.
 * Backend /media/* URLs are rewritten to same-origin /api/media/* because
 * Railway sets Cross-Origin-Resource-Policy: same-origin (blocks cross-site images).
 */
export function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  if (url.startsWith("data:")) return url;

  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      const proxied = proxyBackendMediaUrl(new URL(url));
      if (proxied) return proxied;
    } catch {
      return url;
    }
    return url;
  }

  const cleanUrl = url.startsWith("/") ? url : `/${url}`;

  if (cleanUrl.startsWith("/media/")) {
    const mediaPath = cleanUrl.slice("/media/".length);
    return mediaPath ? `/api/media/${mediaPath}` : null;
  }

  return `${BACKEND_ORIGIN}${cleanUrl}`;
}

export function unwrapPaginatedResult<T>(payload: unknown): PaginatedResult<T> {
  if (payload && typeof payload === "object" && "results" in payload) {
    const data = payload as PaginatedResult<T>;
    return {
      results: Array.isArray(data.results) ? data.results : [],
      pagination: data.pagination ?? { total: 0, page: 1, limit: 10, totalPages: 0 },
    };
  }
  return { results: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } };
}

export function formatPrice(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatLocation(city: string | null, state: string | null, country?: string | null): string {
  const parts = [city, state, country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "India";
}

export function getInitials(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

export function productGradient(id: number): string {
  const gradients = [
    "from-slate-600 to-slate-800",
    "from-emerald-500 to-green-700",
    "from-blue-500 to-indigo-700",
    "from-amber-500 to-orange-600",
    "from-violet-500 to-purple-700",
    "from-stone-500 to-stone-700",
    "from-cyan-500 to-teal-700",
    "from-rose-500 to-pink-700",
  ];
  return gradients[id % gradients.length];
}

export function formatRating(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return value > 0 ? value.toFixed(1) : "New";
}

export function whatsAppHref(phone: string, message?: string): string {
  const digits = phone.replace(/\D/g, "");
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${text}`;
}
