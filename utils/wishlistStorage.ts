const WISHLIST_STORAGE_KEY = "wishlist_ids";

export function readWishlistIds(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0);
  } catch {
    return [];
  }
}

export function writeWishlistIds(ids: number[]): void {
  if (typeof window === "undefined") return;
  const unique = Array.from(new Set(ids));
  localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(unique));
}

export function clearWishlistStorage(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(WISHLIST_STORAGE_KEY);
}
