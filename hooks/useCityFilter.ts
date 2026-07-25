"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useOptionalGeoLocation } from "@/context/GeoLocationContext";
import { isGeoCacheFresh, readGeoLastLocation } from "@/utils/geoLocationStorage";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  applyGeoLocation,
  clearCityFilter as clearCityFilterAction,
  clearLocationFilters as clearLocationFiltersAction,
  setCityFilter,
  setStateFilter,
} from "@/store/slices/filtersSlice";

interface UseCityFilterOptions {
  /** When true, apply granted geo state/city until the user edits filters. */
  syncFromGeo?: boolean;
}

/**
 * Location filter for catalog surfaces. State lives in Redux so the selection
 * (and the geo resolution behind it) is shared across every page that uses this
 * hook instead of being re-derived per mount.
 */
export function useCityFilter(options: UseCityFilterOptions = {}) {
  // Default on: preselect geo state/city wherever LocationFilterBar is used.
  const { syncFromGeo = true } = options;
  const geo = useOptionalGeoLocation();
  const dispatch = useAppDispatch();

  const stateId = useAppSelector((s) => s.filters.stateId);
  const stateLabel = useAppSelector((s) => s.filters.stateLabel);
  const cityId = useAppSelector((s) => s.filters.cityId);
  const cityLabel = useAppSelector((s) => s.filters.cityLabel);
  const userTouched = useAppSelector((s) => s.filters.userTouched);

  const appliedGeoKey = useRef<string | null>(null);
  const requestedRef = useRef(false);

  const cityNumericId = Number(cityId);
  const hasCityFilter =
    Boolean(cityId) && Number.isInteger(cityNumericId) && cityNumericId > 0;

  const cityFilterParams = useMemo(
    () => (hasCityFilter ? { city_id: cityNumericId } : {}),
    [hasCityFilter, cityNumericId]
  );

  // Apply cached geo immediately so dropdowns don't wait on context bootstrap.
  useEffect(() => {
    if (!syncFromGeo || userTouched) return;
    const cached = readGeoLastLocation();
    if (!cached || !isGeoCacheFresh(cached)) return;

    const key = `${cached.state_id}:${cached.city_id}`;
    if (appliedGeoKey.current === key) return;
    appliedGeoKey.current = key;

    dispatch(
      applyGeoLocation({
        stateId: String(cached.state_id),
        stateLabel: cached.state_name?.trim() || "",
        cityId: String(cached.city_id),
        cityLabel: cached.city_name?.trim() || "",
      })
    );
  }, [dispatch, syncFromGeo, userTouched]);

  // Apply live geo context once coordinates resolve to state/city IDs.
  useEffect(() => {
    if (!syncFromGeo || userTouched || !geo) return;
    if (geo.stateId == null || geo.cityId == null) return;

    const key = `${geo.stateId}:${geo.cityId}`;
    if (appliedGeoKey.current === key) return;
    appliedGeoKey.current = key;

    dispatch(
      applyGeoLocation({
        stateId: String(geo.stateId),
        stateLabel: geo.stateName?.trim() || "",
        cityId: String(geo.cityId),
        cityLabel: geo.cityName?.trim() || "",
      })
    );
  }, [
    dispatch,
    syncFromGeo,
    userTouched,
    geo,
    geo?.stateId,
    geo?.cityId,
    geo?.stateName,
    geo?.cityName,
  ]);

  // If filters are still empty after geo is ready, ask context to resolve.
  useEffect(() => {
    if (!syncFromGeo || userTouched || !geo) return;
    if (!geo.ready || geo.locating) return;
    if (geo.stateId != null && geo.cityId != null) return;
    if (geo.permissionStatus === "denied") return;
    if (requestedRef.current) return;

    requestedRef.current = true;
    let retryTimer: number | undefined;
    let cancelled = false;

    void geo
      .requestLocation()
      .catch(() => {
        // Allow another attempt if the geo request itself rejected.
        requestedRef.current = false;
      })
      .finally(() => {
        if (cancelled) return;
        // Allow one more retry if IDs still missing after this attempt.
        retryTimer = window.setTimeout(() => {
          if (readGeoLastLocation()) return;
          requestedRef.current = false;
        }, 1500);
      });

    return () => {
      cancelled = true;
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
    };
  }, [
    syncFromGeo,
    userTouched,
    geo,
    geo?.ready,
    geo?.locating,
    geo?.stateId,
    geo?.cityId,
    geo?.permissionStatus,
    geo?.requestLocation,
  ]);

  const handleStateChange = useCallback(
    (nextStateId: string, label?: string) => {
      dispatch(setStateFilter({ stateId: nextStateId, label }));
    },
    [dispatch]
  );

  const handleCityChange = useCallback(
    (nextCityId: string, label?: string) => {
      dispatch(setCityFilter({ cityId: nextCityId, label }));
    },
    [dispatch]
  );

  const clearStateFilter = useCallback(() => {
    dispatch(clearLocationFiltersAction());
  }, [dispatch]);

  const clearCityFilter = useCallback(() => {
    dispatch(clearCityFilterAction());
  }, [dispatch]);

  const clearLocationFilters = useCallback(() => {
    dispatch(clearLocationFiltersAction());
  }, [dispatch]);

  return {
    stateId,
    stateLabel,
    cityId,
    cityLabel,
    setCityId: handleCityChange,
    handleStateChange,
    handleCityChange,
    clearStateFilter,
    clearCityFilter,
    clearLocationFilters,
    hasLocationFilter: Boolean(stateId || cityId),
    cityFilterParams,
  };
}
