"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import { Select } from "@/components/common/Select";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { fetchCities } from "@/services/locationService";
import type { ApiCity } from "@/types/location";

interface CitySelectProps {
  id: string;
  value: string;
  onChange: (cityId: string, label?: string) => void;
  stateId?: string;
  error?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  selectedLabel?: string;
}

const PAGE_LIMIT = 20;

export default function CitySelect({
  id,
  value,
  onChange,
  stateId,
  error,
  disabled,
  className,
  placeholder = "All cities",
  selectedLabel,
}: CitySelectProps) {
  const [cities, setCities] = useState<ApiCity[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  const stateNumericId = Number(stateId);
  const hasState =
    Boolean(stateId) && Number.isInteger(stateNumericId) && stateNumericId > 0;

  useEffect(() => {
    if (!hasState) {
      setCities([]);
      setPage(1);
      setHasMore(false);
      setLoading(false);
      setSearchInput("");
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setCities([]);
      setPage(1);
      setHasMore(false);

      try {
        const { results, pagination } = await fetchCities({
          page: 1,
          limit: PAGE_LIMIT,
          state_id: stateNumericId,
          search: debouncedSearch || undefined,
          is_active: true,
          sort_by: "name",
          sort_order: "asc",
        });
        if (cancelled) return;
        setCities(results);
        setPage(pagination.page || 1);
        setHasMore(pagination.page < pagination.totalPages);
      } catch {
        if (!cancelled) setCities([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, hasState, stateNumericId]);

  const loadMore = useCallback(async () => {
    if (!hasState || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const { results, pagination } = await fetchCities({
        page: nextPage,
        limit: PAGE_LIMIT,
        state_id: stateNumericId,
        search: debouncedSearch || undefined,
        is_active: true,
        sort_by: "name",
        sort_order: "asc",
      });
      setCities((prev) => {
        const seen = new Set(prev.map((city) => city.id));
        return [...prev, ...results.filter((city) => !seen.has(city.id))];
      });
      setPage(pagination.page || nextPage);
      setHasMore(pagination.page < pagination.totalPages);
    } finally {
      setLoadingMore(false);
    }
  }, [debouncedSearch, hasMore, hasState, loadingMore, page, stateNumericId]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchInput(query);
  }, []);

  const options = useMemo(() => {
    const items = cities.map((city) => ({
      value: String(city.id),
      label: city.name,
    }));

    if (value && selectedLabel && !items.some((item) => item.value === value)) {
      items.unshift({ value, label: selectedLabel });
    }

    return [{ value: "", label: "All cities" }, ...items];
  }, [cities, selectedLabel, value]);

  const resolvedPlaceholder = !hasState
    ? "Select state first"
    : loading && cities.length === 0
      ? "Loading cities..."
      : placeholder;

  return (
    <Select
      id={id}
      value={value}
      onChange={(e) => {
        const next = e.target.value;
        const label = options.find((opt) => opt.value === next)?.label;
        onChange(next, next ? label : undefined);
      }}
      options={options}
      placeholder={resolvedPlaceholder}
      disabled={disabled || !hasState}
      hasMore={hasMore}
      loadingMore={loadingMore || (loading && cities.length > 0)}
      onLoadMore={loadMore}
      onSearchChange={hasState ? handleSearchChange : undefined}
      error={error}
      className={className}
      searchPlaceholder="Search cities..."
      leadingIcon={<MapPin className="h-3.5 w-3.5" />}
    />
  );
}
