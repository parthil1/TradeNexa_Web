"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Select } from "@/components/common/Select";
import { fetchProductById, fetchProducts } from "@/services/catalogService";
import type { ApiProductListItem } from "@/types/catalog";

interface ProductSelectProps {
  id: string;
  value: string;
  onChange: (productId: string) => void;
  subcategoryId?: string;
  error?: boolean;
  disabled?: boolean;
  className?: string;
}

function formatProductLabel(product: ApiProductListItem): string {
  const supplier = product.supplier_name?.trim();
  return supplier ? `${product.name} · ${supplier}` : product.name;
}

function buildListParams(subcategoryId: string, page: number) {
  return {
    page,
    limit: 20,
    sort_by: "name",
    sort_order: "asc" as const,
    subcategory_id: Number(subcategoryId),
  };
}

export default function ProductSelect({
  id,
  value,
  onChange,
  subcategoryId,
  error,
  disabled,
  className,
}: ProductSelectProps) {
  const [products, setProducts] = useState<ApiProductListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [prefetchedName, setPrefetchedName] = useState<string | null>(null);

  const subcategoryNumericId = Number(subcategoryId);
  const hasSubcategory =
    Boolean(subcategoryId) && Number.isInteger(subcategoryNumericId) && subcategoryNumericId > 0;

  useEffect(() => {
    if (!value) {
      setPrefetchedName(null);
      return;
    }

    // Only re-run when the selected value changes. Including `products` here
    // re-fetched /products/:id every time the subcategory list resolved.
    const inList = products.some((product) => String(product.id) === value);
    if (inList) {
      setPrefetchedName(null);
      return;
    }

    let cancelled = false;
    const productId = Number(value);
    if (!Number.isInteger(productId) || productId < 1) return;

    void fetchProductById(productId)
      .then((product) => {
        if (!cancelled && product) {
          setPrefetchedName(product.basic_details.name);
        }
      })
      .catch(() => {
        /* keep the raw id label */
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- products checked only to short-circuit; value drives the fetch
  }, [value]);

  useEffect(() => {
    if (value && products.some((product) => String(product.id) === value)) {
      setPrefetchedName(null);
    }
  }, [value, products]);

  useEffect(() => {
    if (!hasSubcategory) {
      setProducts([]);
      setPage(1);
      setHasMore(false);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setProducts([]);
      setPage(1);
      setHasMore(false);

      try {
        const { results, pagination } = await fetchProducts(
          buildListParams(subcategoryId!, 1)
        );
        if (cancelled) return;
        setProducts(results);
        setPage(pagination.page || 1);
        setHasMore(pagination.page < pagination.totalPages);
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [hasSubcategory, subcategoryId]);

  const loadMore = useCallback(async () => {
    if (!hasSubcategory || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const { results, pagination } = await fetchProducts(
        buildListParams(subcategoryId!, nextPage)
      );
      setProducts((prev) => {
        const seen = new Set(prev.map((product) => product.id));
        return [...prev, ...results.filter((product) => !seen.has(product.id))];
      });
      setPage(pagination.page || nextPage);
      setHasMore(pagination.page < pagination.totalPages);
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, hasSubcategory, loadingMore, page, subcategoryId]);

  const options = useMemo(() => {
    const items = products.map((product) => ({
      value: String(product.id),
      label: formatProductLabel(product),
    }));

    if (value && prefetchedName && !items.some((item) => item.value === value)) {
      items.unshift({ value, label: prefetchedName });
    }

    return [{ value: "", label: "No linked product" }, ...items];
  }, [prefetchedName, products, value]);

  const placeholder = !hasSubcategory
    ? "Select subcategory first (optional)"
    : loading
      ? "Loading products..."
      : products.length === 0
        ? "No products in this subcategory"
        : "Select product (optional)";

  return (
    <Select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      options={options}
      placeholder={placeholder}
      disabled={disabled || !hasSubcategory || loading}
      hasMore={hasMore}
      loadingMore={loadingMore}
      onLoadMore={loadMore}
      error={error}
      className={className}
      searchPlaceholder="Search products..."
    />
  );
}
