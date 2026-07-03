import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/config/endpoints";
import { unwrapApiPayload } from "@/utils/authHelpers";
import { unwrapPaginatedResult } from "@/utils/catalogHelpers";
import type {
  ApiCategory,
  ApiCategoryDetail,
  ApiProductDetail,
  ApiProductListItem,
  ApiSubcategory,
  CatalogListParams,
  PaginatedResult,
  ProductListParams,
} from "@/types/catalog";

function buildParams(params?: CatalogListParams | ProductListParams) {
  const query: Record<string, string | number | boolean> = {
    page: params?.page ?? 1,
    limit: params?.limit ?? 12,
    sort_by: params?.sort_by ?? "name",
    sort_order: params?.sort_order ?? "asc",
  };
  if (params?.search?.trim()) query.search = params.search.trim();
  if (params?.is_active !== undefined) query.is_active = params.is_active;
  if (params && "category_id" in params && params.category_id) {
    query.category_id = params.category_id;
  }
  if (params && "subcategory_id" in params && params.subcategory_id) {
    query.subcategory_id = params.subcategory_id;
  }
  if (params && "is_trending" in params && params.is_trending !== undefined) {
    query.is_trending = params.is_trending;
  }
  return query;
}

export async function fetchCategories(
  params?: CatalogListParams
): Promise<PaginatedResult<ApiCategory>> {
  const response = await apiClient.get(API_ENDPOINTS.CATEGORIES, {
    params: buildParams({ ...params, is_active: params?.is_active ?? true }),
  });
  const data = unwrapApiPayload<unknown>(response.data);
  return unwrapPaginatedResult<ApiCategory>(data);
}

export async function fetchCategoryById(id: number): Promise<ApiCategoryDetail | null> {
  const response = await apiClient.get(`${API_ENDPOINTS.CATEGORIES}/${id}`);
  const data = unwrapApiPayload<ApiCategoryDetail>(response.data);
  return data ?? null;
}

export async function fetchCategoryBySlug(slug: string): Promise<ApiCategoryDetail | null> {
  let page = 1;
  const limit = 50;

  while (page <= 10) {
    const { results, pagination } = await fetchCategories({ page, limit, is_active: true });
    const match = results.find((c) => c.slug === slug);
    if (match) return fetchCategoryById(match.id);
    if (page >= pagination.totalPages) break;
    page += 1;
  }
  return null;
}

export async function fetchSubcategories(
  categoryId: number,
  params?: CatalogListParams
): Promise<PaginatedResult<ApiSubcategory>> {
  const response = await apiClient.get(`${API_ENDPOINTS.CATEGORIES}/${categoryId}/subcategories`, {
    params: buildParams(params),
  });
  const data = unwrapApiPayload<unknown>(response.data);
  return unwrapPaginatedResult<ApiSubcategory>(data);
}

export async function fetchProducts(
  params?: ProductListParams
): Promise<PaginatedResult<ApiProductListItem>> {
  const response = await apiClient.get(API_ENDPOINTS.PRODUCTS, {
    params: buildParams(params),
  });
  const data = unwrapApiPayload<unknown>(response.data);
  return unwrapPaginatedResult<ApiProductListItem>(data);
}

export async function fetchTrendingProducts(limit = 8): Promise<ApiProductListItem[]> {
  const { results } = await fetchProducts({
    page: 1,
    limit,
    is_trending: true,
    sort_by: "created_at",
    sort_order: "desc",
  });
  return results;
}

export async function fetchProductById(id: number): Promise<ApiProductDetail | null> {
  const response = await apiClient.get(`${API_ENDPOINTS.PRODUCTS}/${id}`);
  const data = unwrapApiPayload<ApiProductDetail>(response.data);
  return data ?? null;
}
