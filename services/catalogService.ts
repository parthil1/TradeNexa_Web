import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/config/endpoints";
import { unwrapApiPayload } from "@/utils/authHelpers";
import { unwrapPaginatedResult, normalizeProductListItem } from "@/utils/catalogHelpers";
import type {
  ApiCategory,
  ApiCategoryDetail,
  ApiProductDetail,
  ApiProductListItem,
  ApiSubcategory,
  CatalogListParams,
  PaginatedResult,
  ProductListParams,
  RelatedProductsParams,
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
    params: buildParams({ ...params, is_active: params?.is_active ?? true }),
  });
  const data = unwrapApiPayload<unknown>(response.data);
  return unwrapPaginatedResult<ApiSubcategory>(data);
}

export async function findSubcategoryBySlug(
  categoryId: number,
  subSlug: string
): Promise<ApiSubcategory | null> {
  let page = 1;
  const limit = 50;

  while (page <= 20) {
    const { results, pagination } = await fetchSubcategories(categoryId, { page, limit });
    const match = results.find((s) => s.slug === subSlug && s.is_active);
    if (match) return match;
    if (page >= pagination.totalPages) break;
    page += 1;
  }
  return null;
}

export interface CatalogPathContext {
  categoryHref: string;
  subcategoryHref?: string;
  categoryName?: string;
  subcategoryName?: string;
}

export async function resolveCatalogPaths(
  categoryId: number,
  subcategoryId?: number | null
): Promise<CatalogPathContext | null> {
  const detail = await fetchCategoryById(categoryId);
  if (!detail) return null;

  const categoryHref = `/categories/${detail.slug}`;
  const base: CatalogPathContext = {
    categoryHref,
    categoryName: detail.name,
  };

  if (!subcategoryId) return base;

  let page = 1;
  const limit = 50;
  while (page <= 20) {
    const { results, pagination } = await fetchSubcategories(categoryId, { page, limit });
    const sub = results.find((s) => s.id === subcategoryId && s.is_active);
    if (sub) {
      return {
        ...base,
        subcategoryHref: `/categories/${detail.slug}/${sub.slug}`,
        subcategoryName: sub.name,
      };
    }
    if (page >= pagination.totalPages) break;
    page += 1;
  }

  const embedded = detail.subcategories?.find((s) => s.id === subcategoryId && s.is_active);
  if (embedded) {
    return {
      ...base,
      subcategoryHref: `/categories/${detail.slug}/${embedded.slug}`,
      subcategoryName: embedded.name,
    };
  }

  return base;
}

export async function findSubcategoryById(subcategoryId: number): Promise<{
  category: ApiCategoryDetail;
  subcategory: ApiSubcategory;
} | null> {
  let catPage = 1;

  while (catPage <= 20) {
    const { results: categories, pagination: catPagination } = await fetchCategories({
      page: catPage,
      limit: 50,
      is_active: true,
    });

    for (const cat of categories) {
      let subPage = 1;
      while (subPage <= 20) {
        const { results: subs, pagination: subPagination } = await fetchSubcategories(cat.id, {
          page: subPage,
          limit: 50,
        });
        const match = subs.find((s) => s.id === subcategoryId && s.is_active);
        if (match) {
          const detail = await fetchCategoryById(cat.id);
          if (detail) return { category: detail, subcategory: match };
        }
        if (subPage >= subPagination.totalPages) break;
        subPage += 1;
      }
    }

    if (catPage >= catPagination.totalPages) break;
    catPage += 1;
  }

  return null;
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

export async function fetchRelatedProducts(
  params: RelatedProductsParams
): Promise<PaginatedResult<ApiProductListItem>> {
  const response = await apiClient.get(`${API_ENDPOINTS.PRODUCTS}/related`, {
    params: {
      product_id: params.product_id,
      subcategory_id: params.subcategory_id,
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      sort_by: params.sort_by ?? "name",
      sort_order: params.sort_order ?? "asc",
    },
  });
  const data = unwrapApiPayload<unknown>(response.data);
  const paginated = unwrapPaginatedResult<ApiProductListItem>(data);
  return {
    ...paginated,
    results: paginated.results.map((item) => normalizeProductListItem(item)),
  };
}
