"use client";

import { useMemo, useState } from "react";

export function useCityFilter() {
  const [stateId, setStateId] = useState("");
  const [stateLabel, setStateLabel] = useState("");
  const [cityId, setCityId] = useState("");
  const [cityLabel, setCityLabel] = useState("");

  const cityNumericId = Number(cityId);
  const hasCityFilter =
    Boolean(cityId) && Number.isInteger(cityNumericId) && cityNumericId > 0;

  const cityFilterParams = useMemo(
    () => (hasCityFilter ? { city_id: cityNumericId } : {}),
    [hasCityFilter, cityNumericId]
  );

  function handleStateChange(nextStateId: string, label?: string) {
    setStateId(nextStateId);
    setStateLabel(nextStateId ? (label?.trim() || "") : "");
    setCityId("");
    setCityLabel("");
  }

  function handleCityChange(nextCityId: string, label?: string) {
    setCityId(nextCityId);
    setCityLabel(nextCityId ? (label?.trim() || "") : "");
  }

  function clearStateFilter() {
    setStateId("");
    setStateLabel("");
    setCityId("");
    setCityLabel("");
  }

  function clearCityFilter() {
    setCityId("");
    setCityLabel("");
  }

  function clearLocationFilters() {
    clearStateFilter();
  }

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
