import type { ApiBanner } from "@/types/banner";
import { resolveImageUrl } from "@/utils/catalogHelpers";

function parseRedirectId(redirectId: unknown): number | null {
  const id = Number(redirectId);
  if (!Number.isFinite(id) || id <= 0) return null;
  return id;
}

/** Active banners sorted by priority (higher number = shown first), then id. */
export function sortBannersByPriority(banners: ApiBanner[]): ApiBanner[] {
  return [...banners]
    .filter((b) => b.is_active)
    .sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return a.id - b.id;
    });
}

export function hasBannerRedirect(banner: ApiBanner): boolean {
  return Boolean(String(banner.redirect_type ?? "").trim());
}

/**
 * Map API redirect_type + redirect_id to an in-app route.
 * - category → /buyer/category/{redirect_id}
 * - product  → /buyer/product/{redirect_id}
 */
export function resolveBannerHref(banner: ApiBanner): string | null {
  if (!hasBannerRedirect(banner)) return null;

  const type = String(banner.redirect_type).toLowerCase().trim();
  const id = parseRedirectId(banner.redirect_id);

  if (type === "category" && id != null) {
    return `/buyer/category/${id}`;
  }

  if (type === "product" && id != null) {
    return `/buyer/product/${id}`;
  }

  if (type === "seller" && id != null) {
    return `/buyer/supplier/${id}`;
  }

  if (type === "subcategory" && id != null) {
    return `/buyer/categories`;
  }

  return null;
}

export function resolveBannerImageUrl(banner: ApiBanner): string | null {
  return resolveImageUrl(banner.image);
}
