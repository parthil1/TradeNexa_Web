import type { PaginatedResult, ApiProductListItem } from "@/types/catalog";
import { API_BASE_URL, BACKEND_ORIGIN } from "@/config/api";
import { parseWishlistFlag, readProductWishlistFlag } from "@/utils/wishlistHelpers";

function proxyBackendMediaUrl(url: URL): string | null {
  const backendHost = new URL(BACKEND_ORIGIN).host;
  if (url.host !== backendHost) return null;

  // Legacy product media: /media/foo → /api/media/foo
  if (url.pathname.startsWith("/media/")) {
    const mediaPath = url.pathname.slice("/media/".length);
    return mediaPath ? `/api/media/${mediaPath}${url.search}` : null;
  }

  // Chat uploads and other backend paths — generic same-origin proxy.
  return `/api/media/proxy?url=${encodeURIComponent(url.toString())}`;
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
      "file_url",
      "media_url",
    ]) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
  }

  return null;
}

/**
 * Resolves API image URLs for use in <img> tags.
 * Backend media URLs are rewritten to same-origin /api/media/* because
 * Railway sets Cross-Origin-Resource-Policy: same-origin (blocks cross-site images).
 */
export function resolveImageUrl(url: unknown): string | null {
  const normalized = coerceImageUrl(url);
  if (!normalized) return null;

  if (normalized.startsWith("data:")) return normalized;
  if (normalized.startsWith("blob:")) return normalized;

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

  // Relative non-/media paths (e.g. /uploads/chat/x.jpg) — proxy via backend origin.
  try {
    const absolute = new URL(cleanUrl, BACKEND_ORIGIN);
    const proxied = proxyBackendMediaUrl(absolute);
    if (proxied) return proxied;
  } catch {
    /* fall through */
  }

  return `${BACKEND_ORIGIN}${cleanUrl}`;
}

export type ProductVideoType = "youtube" | "vimeo" | "file";

export interface ResolvedProductVideo {
  key: string;
  type: ProductVideoType;
  src: string;
  embedUrl?: string;
  /** Best thumbnail for display (API, platform, or fallback). */
  thumbnail?: string | null;
  /** Thumbnail supplied explicitly by the API (not auto-generated). */
  apiThumbnail?: string | null;
}

function coerceVideoSource(input: unknown): string | null {
  if (input == null) return null;

  if (typeof input === "string") {
    const trimmed = input.trim();
    return trimmed || null;
  }

  if (typeof input === "object") {
    const record = input as Record<string, unknown>;
    for (const key of ["video_url", "video", "url", "file", "src", "path"]) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
  }

  return null;
}

function coerceVideoThumbnail(input: unknown): string | null {
  if (input == null || typeof input !== "object") return null;

  const record = input as Record<string, unknown>;
  for (const key of [
    "thumbnail",
    "thumb",
    "poster",
    "cover",
    "preview",
    "image_url",
    "image",
  ]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return resolveImageUrl(value.trim());
    }
  }

  return null;
}

function resolveVideoSource(entry: unknown): string | null {
  const raw = coerceVideoSource(entry) ?? (typeof entry === "string" ? entry : null);
  return raw ? resolveImageUrl(raw) : null;
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

export function getVimeoThumbnailUrl(src: string): string | null {
  const id = getVimeoEmbedId(src);
  return id ? `https://vumbnail.com/${id}.jpg` : null;
}

export function getVideoThumbnailUrl(
  video: ResolvedProductVideo,
  fallbackPoster?: string | null
): string | null {
  if (video.apiThumbnail) return video.apiThumbnail;
  if (video.thumbnail) return video.thumbnail;
  if (video.type === "youtube") return getYoutubeThumbnailUrl(video.src);
  if (video.type === "vimeo") return getVimeoThumbnailUrl(video.src);
  return fallbackPoster ?? null;
}

export type GalleryMediaItem =
  | { id: string; kind: "image"; src: string }
  | { id: string; kind: "video"; video: ResolvedProductVideo };

/** Product thumbnail first, then videos with API thumbnails, then gallery, then other videos. */
export function buildProductGalleryMedia(
  gallery: string[],
  videos: ResolvedProductVideo[]
): GalleryMediaItem[] {
  const usedImages = new Set<string>();
  const usedVideos = new Set<string>();
  const items: GalleryMediaItem[] = [];

  const pushImage = (src: string) => {
    if (!src || usedImages.has(src)) return;
    usedImages.add(src);
    items.push({ id: `image:${src}`, kind: "image", src });
  };

  const pushVideo = (video: ResolvedProductVideo) => {
    if (usedVideos.has(video.key)) return;
    usedVideos.add(video.key);
    items.push({ id: `video:${video.key}`, kind: "video", video });
  };

  // 1. Main product thumbnail always first
  if (gallery[0]) pushImage(gallery[0]);

  // 2. Videos with explicit API thumbnails (high priority)
  const videosWithApiThumb = videos.filter((v) => v.apiThumbnail);
  const otherVideos = videos.filter((v) => !v.apiThumbnail);
  videosWithApiThumb.forEach(pushVideo);

  // 3. Remaining gallery images
  gallery.slice(1).forEach(pushImage);

  // 4. Other videos last
  otherVideos.forEach(pushVideo);

  return items;
}

/** Normalize product video entries from API (strings, objects, or embed links). */
export function resolveProductVideos(videos: unknown[] | null | undefined): ResolvedProductVideo[] {
  if (!videos?.length) return [];

  const seen = new Set<string>();
  const resolved: ResolvedProductVideo[] = [];

  for (const entry of videos) {
    const src = resolveVideoSource(entry);
    if (!src || seen.has(src)) continue;
    seen.add(src);

    const apiThumbnail = coerceVideoThumbnail(entry);

    const youtubeId = getYoutubeEmbedId(src);
    if (youtubeId) {
      resolved.push({
        key: src,
        type: "youtube",
        src,
        embedUrl: `https://www.youtube.com/embed/${youtubeId}`,
        apiThumbnail,
        thumbnail: apiThumbnail ?? getYoutubeThumbnailUrl(src),
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
        apiThumbnail,
        thumbnail: apiThumbnail ?? getVimeoThumbnailUrl(src),
      });
      continue;
    }

    resolved.push({
      key: src,
      type: "file",
      src,
      apiThumbnail,
      thumbnail: apiThumbnail,
    });
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
  const raw = item as Record<string, unknown>;
  const address =
    raw.address && typeof raw.address === "object"
      ? (raw.address as Record<string, unknown>)
      : null;
  const location =
    raw.location && typeof raw.location === "object"
      ? (raw.location as Record<string, unknown>)
      : null;

  const pickLocationString = (...values: unknown[]): string | null => {
    for (const value of values) {
      if (typeof value === "string" && value.trim()) return value.trim();
    }
    return null;
  };

  const wishlistFlag =
    item.is_wishlist !== undefined
      ? parseWishlistFlag(item.is_wishlist)
      : readProductWishlistFlag(raw);

  const supplierName =
    (typeof item.supplier_name === "string" && item.supplier_name.trim()
      ? item.supplier_name.trim()
      : null) ??
    (typeof raw.seller_name === "string" && raw.seller_name.trim()
      ? raw.seller_name.trim()
      : null) ??
    "Supplier";

  return {
    id: item.id,
    name: item.name,
    slug: item.slug ?? `product-${item.id}`,
    thumbnail: item.thumbnail ?? null,
    price: item.price,
    currency: item.currency ?? "INR",
    moq: item.moq ?? 1,
    unit: item.unit ?? "unit",
    supplier_name: supplierName,
    verified: item.verified ?? false,
    rating: item.rating ?? 0,
    city: pickLocationString(item.city, address?.city, location?.city),
    state: pickLocationString(item.state, address?.state, location?.state),
    is_trending: item.is_trending ?? false,
    created_at: item.created_at ?? "",
    subcategory_id: item.subcategory_id ?? null,
    subcategory_name: item.subcategory_name ?? null,
    ...(wishlistFlag !== undefined ? { is_wishlist: wishlistFlag } : {}),
  };
}

export function formatPrice(amount: number, currency?: string | null): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency ?? "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatLocation(
  city: string | null | undefined,
  state: string | null | undefined,
  country?: string | null
): string {
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
    "from-navy-mid to-navy",
    "from-navy to-foreground",
    "from-primary to-navy-mid",
    "from-navy-mid to-navy",
    "from-muted-fg to-navy",
    "from-primary-hover to-navy",
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
