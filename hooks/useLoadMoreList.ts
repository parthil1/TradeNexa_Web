import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiPagination, PaginatedResult } from "@/types/catalog";

const EMPTY_PAGINATION: ApiPagination = { total: 0, page: 1, limit: 12, totalPages: 0 };

interface UseLoadMoreListOptions<T> {
  fetchPage: (page: number) => Promise<PaginatedResult<T>>;
  resetDeps?: unknown[];
  enabled?: boolean;
}

export function useLoadMoreList<T>({
  fetchPage,
  resetDeps = [],
  enabled = true,
}: UseLoadMoreListOptions<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [pagination, setPagination] = useState<ApiPagination>(EMPTY_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(1);
  const fetchRef = useRef(fetchPage);

  useEffect(() => {
    fetchRef.current = fetchPage;
  }, [fetchPage]);

  const loadPage = useCallback(async (page: number, append: boolean) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await fetchRef.current(page);
      setPagination(data.pagination);
      pageRef.current = data.pagination.page;
      setItems((prev) => (append ? [...prev, ...data.results] : data.results));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
      if (!append) {
        setItems([]);
        setPagination(EMPTY_PAGINATION);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    pageRef.current = 1;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchRef.current(1);
        if (cancelled) return;
        setPagination(data.pagination);
        pageRef.current = data.pagination.page;
        setItems(data.results);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load data");
        setItems([]);
        setPagination(EMPTY_PAGINATION);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...resetDeps]);

  const loadMore = useCallback(() => {
    if (loading || loadingMore) return;
    if (pageRef.current >= pagination.totalPages) return;
    void loadPage(pageRef.current + 1, true);
  }, [loading, loadingMore, pagination.totalPages, loadPage]);

  const hasMore = pagination.page < pagination.totalPages;

  return {
    items,
    pagination,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    setItems,
  };
}
