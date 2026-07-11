"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  GeoPositionError,
  isGeolocationSupported,
  queryBrowserGeolocationPermission,
  resolveGeoLocationFromBrowser,
} from "@/hooks/useGeoLocation";
import type { ResolvedGeoLocation } from "@/types/location";
import {
  type GeoPermissionStatus,
  clearGeoLastError,
  isGeoCacheFresh,
  readGeoLastLocation,
  readGeoPermissionStatus,
  writeGeoLastError,
  writeGeoLastLocation,
  writeGeoPermissionStatus,
} from "@/utils/geoLocationStorage";

interface GeoLocationContextValue {
  stateId: number | null;
  cityId: number | null;
  stateName: string | null;
  cityName: string | null;
  permissionStatus: GeoPermissionStatus;
  ready: boolean;
  locating: boolean;
  requestLocation: () => Promise<void>;
}

const GeoLocationContext = createContext<GeoLocationContextValue | undefined>(undefined);

function persistResolved(resolved: ResolvedGeoLocation) {
  clearGeoLastError();
  writeGeoPermissionStatus("granted");
  writeGeoLastLocation({
    state_id: resolved.state_id,
    city_id: resolved.city_id,
    state_name: resolved.state_name,
    city_name: resolved.city_name,
    lat: resolved.lat,
    lng: resolved.lng,
    timestamp: Date.now(),
  });
}

export function GeoLocationProvider({ children }: { children: React.ReactNode }) {
  const [permissionStatus, setPermissionStatus] = useState<GeoPermissionStatus>(() =>
    typeof window === "undefined" ? "unset" : readGeoPermissionStatus()
  );
  const [stateId, setStateId] = useState<number | null>(null);
  const [cityId, setCityId] = useState<number | null>(null);
  const [stateName, setStateName] = useState<string | null>(null);
  const [cityName, setCityName] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [locating, setLocating] = useState(false);
  const locateSeq = useRef(0);

  const applyResolved = useCallback((resolved: ResolvedGeoLocation) => {
    persistResolved(resolved);
    setPermissionStatus("granted");
    setStateId(resolved.state_id);
    setCityId(resolved.city_id);
    setStateName(resolved.state_name);
    setCityName(resolved.city_name);
  }, []);

  const applyCache = useCallback((cached: NonNullable<ReturnType<typeof readGeoLastLocation>>) => {
    writeGeoPermissionStatus("granted");
    setPermissionStatus("granted");
    setStateId(cached.state_id);
    setCityId(cached.city_id);
    setStateName(cached.state_name ?? null);
    setCityName(cached.city_name ?? null);
  }, []);

  const markNativeDenied = useCallback(() => {
    writeGeoPermissionStatus("denied");
    writeGeoLastError("Browser location permission denied");
    setPermissionStatus("denied");
  }, []);

  const refreshFromBrowser = useCallback(async () => {
    const seq = ++locateSeq.current;
    setLocating(true);
    try {
      const resolved = await resolveGeoLocationFromBrowser();
      persistResolved(resolved);
      if (seq === locateSeq.current) {
        applyResolved(resolved);
      }
    } finally {
      if (seq === locateSeq.current) {
        setLocating(false);
      }
    }
  }, [applyResolved]);

  const requestLocation = useCallback(async () => {
    if (!isGeolocationSupported()) return;
    try {
      await refreshFromBrowser();
    } catch (error) {
      const message =
        error instanceof Error ? `${(error as GeoPositionError).code ?? "ERROR"}: ${error.message}` : "Locate failed";
      writeGeoLastError(message);
      if (error instanceof GeoPositionError && error.code === "PERMISSION_DENIED") {
        markNativeDenied();
      }
    }
  }, [markNativeDenied, refreshFromBrowser]);

  useEffect(() => {
    let cancelled = false;
    let permissionStatusObj: PermissionStatus | null = null;

    async function runLocate() {
      try {
        await refreshFromBrowser();
      } catch (error) {
        if (cancelled) return;
        const message =
          error instanceof Error
            ? `${(error as GeoPositionError).code ?? "ERROR"}: ${error.message}`
            : "Locate failed";
        writeGeoLastError(message);
        if (error instanceof GeoPositionError && error.code === "PERMISSION_DENIED") {
          markNativeDenied();
        }
      }
    }

    async function bootstrap() {
      if (!isGeolocationSupported()) {
        writeGeoPermissionStatus("denied");
        writeGeoLastError("Geolocation unsupported");
        if (!cancelled) {
          setPermissionStatus("denied");
          setReady(true);
        }
        return;
      }

      const cached = readGeoLastLocation();
      if (cached && isGeoCacheFresh(cached) && !cancelled) {
        applyCache(cached);
      }

      const browserPermission = await queryBrowserGeolocationPermission();
      if (cancelled) return;

      if (browserPermission === "denied") {
        writeGeoPermissionStatus("denied");
        writeGeoLastError("Browser location permission denied");
        setPermissionStatus("denied");
        setReady(true);
        return;
      }

      // Browser already allowed → status must be "granted" (not "unset").
      if (browserPermission === "granted") {
        writeGeoPermissionStatus("granted");
        if (!cancelled) setPermissionStatus("granted");
      } else {
        // prompt / unsupported — only clear a stale denied so we can ask again.
        if (readGeoPermissionStatus() === "denied" && !cached) {
          writeGeoPermissionStatus("unset");
        }
        if (!cancelled) setPermissionStatus(readGeoPermissionStatus());
      }

      if (!cancelled) setReady(true);

      if (!cached || !isGeoCacheFresh(cached) || browserPermission === "granted") {
        await runLocate();
      }
    }

    void bootstrap();

    void (async () => {
      if (!navigator.permissions?.query) return;
      try {
        permissionStatusObj = await navigator.permissions.query({ name: "geolocation" });
        permissionStatusObj.onchange = () => {
          if (cancelled) return;
          if (permissionStatusObj?.state === "granted") {
            writeGeoPermissionStatus("granted");
            setPermissionStatus("granted");
            void runLocate();
          } else if (permissionStatusObj?.state === "denied") {
            markNativeDenied();
          }
        };
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
      if (permissionStatusObj) permissionStatusObj.onchange = null;
    };
  }, [applyCache, markNativeDenied, refreshFromBrowser]);

  useEffect(() => {
    if (stateId != null && cityId != null) return;
    const cached = readGeoLastLocation();
    if (cached && isGeoCacheFresh(cached)) {
      applyCache(cached);
    }
  }, [applyCache, stateId, cityId, locating, permissionStatus]);

  const value = useMemo<GeoLocationContextValue>(
    () => ({
      stateId,
      cityId,
      stateName,
      cityName,
      permissionStatus,
      ready,
      locating,
      requestLocation,
    }),
    [
      stateId,
      cityId,
      stateName,
      cityName,
      permissionStatus,
      ready,
      locating,
      requestLocation,
    ]
  );

  return <GeoLocationContext.Provider value={value}>{children}</GeoLocationContext.Provider>;
}

export function useGeoLocationContext(): GeoLocationContextValue {
  const context = useContext(GeoLocationContext);
  if (!context) {
    throw new Error("useGeoLocationContext must be used within GeoLocationProvider");
  }
  return context;
}

export function useOptionalGeoLocation(): GeoLocationContextValue | null {
  return useContext(GeoLocationContext) ?? null;
}
