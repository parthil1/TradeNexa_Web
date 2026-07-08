import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/config/endpoints";
import { unwrapApiPayload } from "@/utils/authHelpers";
import { unwrapPaginatedResult } from "@/utils/catalogHelpers";
import type { ApiBusinessType } from "@/types/businessType";

export interface BusinessTypesPageResult {
  results: ApiBusinessType[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

function isBusinessTypeActive(item: ApiBusinessType): boolean {
  if (item.is_active === undefined || item.is_active === null) return true;
  return item.is_active === true || item.is_active === 1;
}

function normalizeBusinessTypes(items: ApiBusinessType[]): ApiBusinessType[] {
  const seen = new Set<number>();
  return items.filter((item) => {
    if (!item?.id || seen.has(item.id)) return false;
    if (!isBusinessTypeActive(item)) return false;
    seen.add(item.id);
    return true;
  });
}

export async function fetchBusinessTypesPage(
  roleId: number,
  page = 1,
  limit = 10
): Promise<BusinessTypesPageResult> {
  const response = await apiClient.get(API_ENDPOINTS.BUSINESS_TYPES, {
    params: {
      role_id: roleId,
      page,
      limit,
    },
  });

  const payload = unwrapApiPayload<unknown>(response.data);
  const { results, pagination } = unwrapPaginatedResult<ApiBusinessType>(payload);

  const pageItems = results.length
    ? results
    : Array.isArray(payload)
      ? (payload as ApiBusinessType[])
      : [];

  return {
    results: normalizeBusinessTypes(pageItems),
    pagination: {
      total: pagination.total || pageItems.length,
      page: pagination.page || page,
      limit: pagination.limit || limit,
      totalPages: Math.max(pagination.totalPages || 1, 1),
    },
  };
}

/** Loads all pages (used where infinite scroll is not needed). */
export async function fetchBusinessTypes(roleId: number): Promise<ApiBusinessType[]> {
  const all: ApiBusinessType[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages && page <= 20) {
    const { results, pagination } = await fetchBusinessTypesPage(roleId, page, 50);
    all.push(...results);
    totalPages = Math.max(pagination.totalPages || 1, 1);
    page += 1;
    if (!results.length) break;
  }

  return normalizeBusinessTypes(all);
}
