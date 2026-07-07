import type { PaginatedResult, ApiProductListItem } from "@/types/catalog";
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

export function normalizeProductListItem(
  item: Partial<ApiProductListItem> & Pick<ApiProductListItem, "id" | "name" | "price">
): ApiProductListItem {
  return {
    id: item.id,
    name: item.name,
    slug: item.slug ?? `product-${item.id}`,
    thumbnail: item.thumbnail ?? null,
    price: item.price,
    currency: item.currency ?? "INR",
    moq: item.moq ?? 1,
    unit: item.unit ?? "unit",
    supplier_name: item.supplier_name ?? "Supplier",
    verified: item.verified ?? false,
    rating: item.rating ?? 0,
    city: item.city ?? null,
    state: item.state ?? null,
    is_trending: item.is_trending ?? false,
    created_at: item.created_at ?? "",
    subcategory_id: item.subcategory_id ?? null,
    subcategory_name: item.subcategory_name ?? null,
  };
}

export function formatPrice(amount: number, currency?: string | null): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency ?? "INR",
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
    "from-[#1a3a5c] to-[#234a73]",
    "from-slate-700 to-slate-900",
    "from-blue-900 to-[#1a3a5c]",
    "from-[#234a73] to-[#1a2b4c]",
    "from-slate-600 to-blue-900",
    "from-blue-800 to-slate-800",
  ];
  return gradients[id % gradients.length];
}

export function formatRating(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return value > 0 ? value.toFixed(1) : "New";
}

export function formatListedAgo(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "Recently listed";

  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Listed today";
  if (days === 1) return "Listed 1 day ago";
  if (days < 30) return `Listed ${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return "Listed 1 month ago";
  return `Listed ${months} months ago`;
}

export function whatsAppHref(phone: string, message?: string): string {
  const digits = phone.replace(/\D/g, "");
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${text}`;
}
