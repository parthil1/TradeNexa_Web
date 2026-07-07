import type { PaginatedResult, ApiProductListItem } from "@/types/catalog";
import { API_BASE_URL, BACKEND_ORIGIN } from "@/config/api";

function proxyBackendMediaUrl(url: URL): string | null {
  const backendHost = new URL(BACKEND_ORIGIN).host;
  if (url.host !== backendHost) return null;
  if (!url.pathname.startsWith("/media/")) return null;
  const mediaPath = url.pathname.slice("/media/".length);
  return mediaPath ? `/api/media/${mediaPath}` : null;
}

function coerceImageUrl(input: unknown): string | null {
  if (input == null) return null;

  if (typeof input === "string") {
    const trimmed = input.trim();
    return trimmed || null;
  }

  if (typeof input === "number" && Number.isFinite(input)) {
    return String(input);
  }

  if (typeof input === "object") {
    const record = input as Record<string, unknown>;
    for (const key of [
      "url",
      "image_url",
      "video_url",
      "video",
      "image",
      "path",
      "src",
      "thumbnail",
      "file",
    ]) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
  }

  return null;
}

/**
 * Resolves API image URLs for use in <img> tags.
 * Backend /media/* URLs are rewritten to same-origin /api/media/* because
 * Railway sets Cross-Origin-Resource-Policy: same-origin (blocks cross-site images).
 */
export function resolveImageUrl(url: unknown): string | null {
  const normalized = coerceImageUrl(url);
  if (!normalized) return null;

  if (normalized.startsWith("data:")) return normalized;

  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    try {
      const proxied = proxyBackendMediaUrl(new URL(normalized));
      if (proxied) return proxied;
    } catch {
      return normalized;
    }
    return normalized;
  }

  const cleanUrl = normalized.startsWith("/") ? normalized : `/${normalized}`;

  if (cleanUrl.startsWith("/media/")) {
    const mediaPath = cleanUrl.slice("/media/".length);
    return mediaPath ? `/api/media/${mediaPath}` : null;
  }

  return `${BACKEND_ORIGIN}${cleanUrl}`;
}

export type ProductVideoType = "youtube" | "vimeo" | "file";

export interface ResolvedProductVideo {
  key: string;
  type: ProductVideoType;
  src: string;
  embedUrl?: string;
}

function getYoutubeEmbedId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id || null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname.startsWith("/embed/")) {
        return parsed.pathname.split("/")[2] ?? null;
      }
      if (parsed.pathname.startsWith("/shorts/")) {
        return parsed.pathname.split("/")[2] ?? null;
      }
      return parsed.searchParams.get("v");
    }
  } catch {
    return null;
  }
  return null;
}

function getVimeoEmbedId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host !== "vimeo.com" && host !== "player.vimeo.com") return null;

    if (parsed.pathname.startsWith("/video/")) {
      return parsed.pathname.split("/")[2] ?? null;
    }

    const parts = parsed.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] ?? null;
  } catch {
    return null;
  }
}

export function getYoutubeThumbnailUrl(src: string): string | null {
  const id = getYoutubeEmbedId(src);
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
}

/** Normalize product video entries from API (strings, objects, or embed links). */
export function resolveProductVideos(videos: unknown[] | null | undefined): ResolvedProductVideo[] {
  if (!videos?.length) return [];

  const seen = new Set<string>();
  const resolved: ResolvedProductVideo[] = [];

  for (const entry of videos) {
    const src = resolveImageUrl(entry);
    if (!src || seen.has(src)) continue;
    seen.add(src);

    const youtubeId = getYoutubeEmbedId(src);
    if (youtubeId) {
      resolved.push({
        key: src,
        type: "youtube",
        src,
        embedUrl: `https://www.youtube.com/embed/${youtubeId}`,
      });
      continue;
    }

    const vimeoId = getVimeoEmbedId(src);
    if (vimeoId) {
      resolved.push({
        key: src,
        type: "vimeo",
        src,
        embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
      });
      continue;
    }

    resolved.push({ key: src, type: "file", src });
  }

  return resolved;
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

export function getInitials(name: string | null | undefined): string {
  if (!name || typeof name !== "string") return "?";
  const trimmed = name.trim();
  return trimmed.charAt(0).toUpperCase() || "?";
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
