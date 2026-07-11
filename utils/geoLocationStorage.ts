export type GeoPermissionStatus = "granted" | "denied" | "unset";

export interface GeoLastLocation {
  state_id: number;
  city_id: number;
  state_name?: string;
  city_name?: string;
  lat: number;
  lng: number;
  timestamp: number;
}

export const GEO_PERMISSION_KEY = "geo_permission_status";
export const GEO_LAST_LOCATION_KEY = "geo_last_location";
export const GEO_LAST_ERROR_KEY = "geo_last_error";
export const GEO_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function readGeoPermissionStatus(): GeoPermissionStatus {
  if (typeof window === "undefined") return "unset";
  try {
    const value = localStorage.getItem(GEO_PERMISSION_KEY);
    if (value === "granted" || value === "denied" || value === "unset") return value;
  } catch {
    /* ignore */
  }
  return "unset";
}

export function writeGeoPermissionStatus(status: GeoPermissionStatus): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GEO_PERMISSION_KEY, status);
  } catch {
    /* ignore */
  }
}

export function writeGeoLastError(message: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      GEO_LAST_ERROR_KEY,
      JSON.stringify({ message, timestamp: Date.now() })
    );
  } catch {
    /* ignore */
  }
}

export function clearGeoLastError(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(GEO_LAST_ERROR_KEY);
  } catch {
    /* ignore */
  }
}

export function readGeoLastLocation(): GeoLastLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(GEO_LAST_LOCATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GeoLastLocation>;
    if (
      typeof parsed.state_id !== "number" ||
      typeof parsed.city_id !== "number" ||
      typeof parsed.lat !== "number" ||
      typeof parsed.lng !== "number" ||
      typeof parsed.timestamp !== "number"
    ) {
      return null;
    }
    return {
      state_id: parsed.state_id,
      city_id: parsed.city_id,
      state_name: typeof parsed.state_name === "string" ? parsed.state_name : undefined,
      city_name: typeof parsed.city_name === "string" ? parsed.city_name : undefined,
      lat: parsed.lat,
      lng: parsed.lng,
      timestamp: parsed.timestamp,
    };
  } catch {
    return null;
  }
}

export function writeGeoLastLocation(location: GeoLastLocation): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GEO_LAST_LOCATION_KEY, JSON.stringify(location));
  } catch {
    /* ignore */
  }
}

export function isGeoCacheFresh(location: GeoLastLocation | null, now = Date.now()): boolean {
  if (!location) return false;
  return now - location.timestamp < GEO_CACHE_TTL_MS;
}
