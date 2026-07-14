import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiPagination, PaginatedResult } from "@/types/catalog";
import { formatApiErrorMessage } from "@/utils/apiErrors";

const EMPTY_PAGINATION: ApiPagination = { total: 0, page: 1, limit: 10, totalPages: 0 };

function getErrorMessage(err: unknown): string {
  return formatApiErrorMessage(err, "Failed to load data");
}

interface UsePaginatedListOptions<T> {
  fetchPage: (page: number) => Promise<PaginatedResult<T>>;
  resetDeps?: unknown[];
  enabled?: boolean;
}

export function usePaginatedList<T>({
  fetchPage,
  resetDeps = [],
  enabled = true,
}: UsePaginatedListOptions<T>) {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<T[]>([]);
  const [pagination, setPagination] = useState<ApiPagination>(EMPTY_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchRef = useRef(fetchPage);

  useEffect(() => {
    fetchRef.current = fetchPage;
  }, [fetchPage]);

  const load = useCallback(async (targetPage: number) => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchRef.current(targetPage);
      setItems(data.results);
      setPagination(data.pagination);
      setPage(data.pagination.page || targetPage);
    } catch (err) {
      setError(getErrorMessage(err));
      setItems([]);
      setPagination(EMPTY_PAGINATION);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchRef.current(1);
        if (cancelled) return;
        setItems(data.results);
        setPagination(data.pagination);
        setPage(data.pagination.page || 1);
      } catch (err) {
        if (cancelled) return;
        setError(getErrorMessage(err));
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

  const goToPage = useCallback(
    (nextPage: number) => {
      if (nextPage < 1 || loading) return;
      if (pagination.totalPages > 0 && nextPage > pagination.totalPages) return;
      void load(nextPage);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [load, loading, pagination.totalPages]
  );

  const reload = useCallback(() => {
    void load(page);
  }, [load, page]);

  return {
    items,
    pagination,
    loading,
    error,
    page,
    setItems,
    goToPage,
    reload,
  };
}
