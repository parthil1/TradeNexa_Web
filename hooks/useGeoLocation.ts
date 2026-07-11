"use client";

import { resolveLocationFromCoordinates } from "@/services/locationService";
import type { ResolvedGeoLocation } from "@/types/location";

export type GeoPositionErrorCode =
  | "PERMISSION_DENIED"
  | "POSITION_UNAVAILABLE"
  | "TIMEOUT"
  | "UNSUPPORTED"
  | "UNKNOWN";

export class GeoPositionError extends Error {
  code: GeoPositionErrorCode;

  constructor(code: GeoPositionErrorCode, message: string) {
    super(message);
    this.name = "GeoPositionError";
    this.code = code;
  }
}

export function isGeolocationSupported(): boolean {
  return typeof navigator !== "undefined" && "geolocation" in navigator;
}

export async function queryBrowserGeolocationPermission(): Promise<
  PermissionState | "unsupported"
> {
  if (typeof navigator === "undefined" || !navigator.permissions?.query) {
    return "unsupported";
  }
  try {
    const result = await navigator.permissions.query({ name: "geolocation" });
    return result.state;
  } catch {
    return "unsupported";
  }
}

function mapGeoError(error: GeolocationPositionError): GeoPositionError {
  if (error.code === error.PERMISSION_DENIED) {
    return new GeoPositionError("PERMISSION_DENIED", error.message || "Permission denied");
  }
  if (error.code === error.POSITION_UNAVAILABLE) {
    return new GeoPositionError("POSITION_UNAVAILABLE", error.message || "Position unavailable");
  }
  if (error.code === error.TIMEOUT) {
    return new GeoPositionError("TIMEOUT", error.message || "Location timeout");
  }
  return new GeoPositionError("UNKNOWN", error.message || "Unknown geolocation error");
}

export function getCurrentPosition(options?: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!isGeolocationSupported()) {
      reject(new GeoPositionError("UNSUPPORTED", "Geolocation is not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      resolve,
      (error) => reject(mapGeoError(error)),
      {
        enableHighAccuracy: false,
        timeout: 20000,
        maximumAge: 10 * 60_000,
        ...options,
      }
    );
  });
}

function getPositionViaWatch(timeoutMs: number): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!isGeolocationSupported()) {
      reject(new GeoPositionError("UNSUPPORTED", "Geolocation is not supported"));
      return;
    }

    let settled = false;
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (settled) return;
        settled = true;
        navigator.geolocation.clearWatch(watchId);
        window.clearTimeout(timer);
        resolve(position);
      },
      (error) => {
        if (settled) return;
        settled = true;
        navigator.geolocation.clearWatch(watchId);
        window.clearTimeout(timer);
        reject(mapGeoError(error));
      },
      { enableHighAccuracy: false, maximumAge: 10 * 60_000, timeout: timeoutMs }
    );

    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      navigator.geolocation.clearWatch(watchId);
      reject(new GeoPositionError("TIMEOUT", "watchPosition timed out"));
    }, timeoutMs);
  });
}

/** Try several GPS strategies — desktop Windows often fails on the first attempt. */
export async function getCurrentPositionReliable(): Promise<GeolocationPosition> {
  const attempts: PositionOptions[] = [
    { enableHighAccuracy: false, timeout: 12000, maximumAge: 30 * 60_000 },
    { enableHighAccuracy: false, timeout: 20000, maximumAge: 0 },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
  ];

  let lastError: unknown;

  for (const options of attempts) {
    try {
      return await getCurrentPosition(options);
    } catch (error) {
      lastError = error;
      if (error instanceof GeoPositionError && error.code === "PERMISSION_DENIED") {
        throw error;
      }
    }
  }

  try {
    return await getPositionViaWatch(20000);
  } catch (error) {
    throw lastError instanceof Error ? lastError : error;
  }
}

/** Get browser coords and resolve to state_id/city_id via existing location APIs. */
export async function resolveGeoLocationFromBrowser(): Promise<ResolvedGeoLocation> {
  const position = await getCurrentPositionReliable();
  const { latitude, longitude } = position.coords;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new GeoPositionError("POSITION_UNAVAILABLE", "Invalid coordinates from browser");
  }

  const resolved = await resolveLocationFromCoordinates(latitude, longitude);
  if (!resolved) {
    throw new GeoPositionError(
      "POSITION_UNAVAILABLE",
      `Could not match coordinates (${latitude.toFixed(4)}, ${longitude.toFixed(4)}) to state/city`
    );
  }
  return resolved;
}
