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
  fetchRef.current = fetchPage;

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
    pageRef.current = 1;
    void loadPage(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, loadPage, ...resetDeps]);

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
