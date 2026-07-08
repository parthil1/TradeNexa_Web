import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/config/endpoints";
import { unwrapApiPayload } from "@/utils/authHelpers";
import { unwrapPaginatedResult } from "@/utils/catalogHelpers";
import type { ApiBrand } from "@/types/brand";

export interface BrandsPageResult {
  results: ApiBrand[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

function isBrandActive(item: ApiBrand): boolean {
  if (item.is_active === undefined || item.is_active === null) return true;
  return item.is_active === true || item.is_active === 1;
}

function normalizeBrands(items: ApiBrand[]): ApiBrand[] {
  const seen = new Set<number>();
  return items.filter((item) => {
    if (!item?.id || seen.has(item.id)) return false;
    if (!isBrandActive(item)) return false;
    seen.add(item.id);
    return true;
  });
}

export async function fetchBrandsPage(page = 1, limit = 20): Promise<BrandsPageResult> {
  const response = await apiClient.get(API_ENDPOINTS.BRANDS, {
    params: { page, limit, is_active: true },
  });

  const payload = unwrapApiPayload<unknown>(response.data);
  const { results, pagination } = unwrapPaginatedResult<ApiBrand>(payload);

  const pageItems = results.length
    ? results
    : Array.isArray(payload)
      ? (payload as ApiBrand[])
      : [];

  return {
    results: normalizeBrands(pageItems),
    pagination: {
      total: pagination.total || pageItems.length,
      page: pagination.page || page,
      limit: pagination.limit || limit,
      totalPages: Math.max(pagination.totalPages || 1, 1),
    },
  };
}
