"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import { Select } from "@/components/common/Select";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { fetchStates } from "@/services/locationService";
import { INDIA_COUNTRY_ID, type ApiState } from "@/types/location";

interface StateSelectProps {
  id: string;
  value: string;
  onChange: (stateId: string, label?: string) => void;
  countryId?: number;
  error?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  selectedLabel?: string;
  /** Label for the empty/clear option. Defaults to "All states". */
  emptyLabel?: string;
}

const PAGE_LIMIT = 20;

export default function StateSelect({
  id,
  value,
  onChange,
  countryId = INDIA_COUNTRY_ID,
  error,
  disabled,
  className,
  placeholder = "All states",
  selectedLabel,
  emptyLabel = "All states",
}: StateSelectProps) {
  const [states, setStates] = useState<ApiState[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setStates([]);
      setPage(1);
      setHasMore(false);

      try {
        const { results, pagination } = await fetchStates({
          page: 1,
          limit: PAGE_LIMIT,
          country_id: countryId,
          search: debouncedSearch || undefined,
          is_active: true,
          sort_by: "name",
          sort_order: "asc",
        });
        if (cancelled) return;
        setStates(results);
        setPage(pagination.page || 1);
        setHasMore(pagination.page < pagination.totalPages);
      } catch {
        if (!cancelled) setStates([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [countryId, debouncedSearch]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const { results, pagination } = await fetchStates({
        page: nextPage,
        limit: PAGE_LIMIT,
        country_id: countryId,
        search: debouncedSearch || undefined,
        is_active: true,
        sort_by: "name",
        sort_order: "asc",
      });
      setStates((prev) => {
        const seen = new Set(prev.map((state) => state.id));
        return [...prev, ...results.filter((state) => !seen.has(state.id))];
      });
      setPage(pagination.page || nextPage);
      setHasMore(pagination.page < pagination.totalPages);
    } finally {
      setLoadingMore(false);
    }
  }, [countryId, debouncedSearch, hasMore, loadingMore, page]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchInput(query);
  }, []);

  const options = useMemo(() => {
    const items = states.map((state) => ({
      value: String(state.id),
      label: state.name,
    }));

    if (value) {
      const alreadyListed = items.some((item) => item.value === value);
      if (!alreadyListed) {
        items.unshift({
          value,
          label: selectedLabel?.trim() || `State #${value}`,
        });
      }
    }

    return [{ value: "", label: emptyLabel }, ...items];
  }, [emptyLabel, selectedLabel, states, value]);

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
      placeholder={loading && states.length === 0 ? "Loading states..." : placeholder}
      disabled={disabled}
      hasMore={hasMore}
      loadingMore={loadingMore || (loading && states.length > 0)}
      onLoadMore={loadMore}
      onSearchChange={handleSearchChange}
      error={error}
      className={className}
      searchPlaceholder="Search states..."
      leadingIcon={<MapPin className="h-3.5 w-3.5" />}
    />
  );
}
