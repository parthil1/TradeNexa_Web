import apiClient from "@/services/apiClient";
import { API_ENDPOINTS, sellerProductsEndpoint } from "@/config/endpoints";
import { unwrapApiPayload } from "@/utils/authHelpers";
import { unwrapPaginatedResult, normalizeProductListItem } from "@/utils/catalogHelpers";
import { extractApprovalStatus, parseApprovalStatus } from "@/utils/productApprovalHelpers";
import type {
  ApiCategory,
  ApiCategoryDetail,
  ApiProductDetail,
  ApiProductListItem,
  ApiSubcategory,
  CatalogListParams,
  PaginatedResult,
  ProductListParams,
  MyProductListParams,
  RelatedProductsParams,
} from "@/types/catalog";

/** Logged-in user id → sent as `seller_id` on product list APIs. */
function getLoggedInUserId(): number | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return undefined;
    const user = JSON.parse(raw) as { id?: string | number; user_id?: number | null };
    if (typeof user.user_id === "number" && Number.isFinite(user.user_id) && user.user_id > 0) {
      return user.user_id;
    }
    const fromId = Number(user.id);
    if (Number.isFinite(fromId) && fromId > 0) return fromId;
  } catch {
    /* ignore */
  }
  return undefined;
}

function buildParams(params?: CatalogListParams | ProductListParams | MyProductListParams) {
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
  if (params && "brand_id" in params && params.brand_id) {
    query.brand_id = params.brand_id;
  }
  if (params && "city_id" in params && params.city_id) {
    query.city_id = params.city_id;
  }
  if (params && "is_trending" in params && params.is_trending !== undefined) {
    query.is_trending = params.is_trending;
  }
  if (params && "seller_id" in params && params.seller_id) {
    query.seller_id = params.seller_id;
  }
  const brandId = (params as MyProductListParams | undefined)?.brand_id;
  if (brandId && !query.brand_id) query.brand_id = brandId;
  const approvalStatus = (params as MyProductListParams | undefined)?.approval_status;
  if (approvalStatus) query.approval_status = approvalStatus;
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
  const sellerId = params?.seller_id ?? getLoggedInUserId();
  const response = await apiClient.get(API_ENDPOINTS.PRODUCTS, {
    params: buildParams({
      ...params,
      ...(sellerId ? { seller_id: sellerId } : {}),
    }),
  });
  const data = unwrapApiPayload<unknown>(response.data);
  const paginated = unwrapPaginatedResult<ApiProductListItem>(data);
  return {
    ...paginated,
    results: paginated.results.map((item) => normalizeProductListItem(item)),
  };
}

/** GET /api/v1/sellers/:id/products — public seller catalog for buyer supplier pages. */
export async function fetchSellerProducts(
  sellerId: number,
  params?: CatalogListParams
): Promise<PaginatedResult<ApiProductListItem>> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 10;
  const response = await apiClient.get(sellerProductsEndpoint(sellerId), {
    params: {
      page,
      limit,
      sort_by: params?.sort_by ?? "id",
      sort_order: params?.sort_order ?? "asc",
      ...(params?.search?.trim() ? { search: params.search.trim() } : {}),
    },
  });
  const data = unwrapApiPayload<unknown>(response.data);
  const paginated = unwrapPaginatedResult<ApiProductListItem>(data);
  return {
    ...paginated,
    results: paginated.results.map((item) => normalizeProductListItem(item)),
  };
}

/** GET /api/v1/products/my — seller's own catalog (requires auth). */
export async function fetchMyProducts(
  params?: MyProductListParams
): Promise<PaginatedResult<ApiProductListItem>> {
  const response = await apiClient.get(`${API_ENDPOINTS.PRODUCTS}/my`, {
    params: buildParams(params),
  });
  const data = unwrapApiPayload<unknown>(response.data);
  const paginated = unwrapPaginatedResult<ApiProductListItem>(data);
  return {
    ...paginated,
    results: paginated.results.map((item) => normalizeProductListItem(item)),
  };
}

export async function fetchTrendingProducts(
  params?: CatalogListParams & { city_id?: number; seller_id?: number }
): Promise<PaginatedResult<ApiProductListItem>> {
  const sellerId = params?.seller_id ?? getLoggedInUserId();
  const query: Record<string, string | number> = {
    page: params?.page ?? 1,
    limit: params?.limit ?? 10,
    sort_by: params?.sort_by ?? "name",
    sort_order: params?.sort_order ?? "asc",
  };
  if (params?.search?.trim()) query.search = params.search.trim();
  if (params?.city_id) query.city_id = params.city_id;
  if (sellerId) query.seller_id = sellerId;

  const response = await apiClient.get(`${API_ENDPOINTS.PRODUCTS}/trending`, { params: query });
  const data = unwrapApiPayload<unknown>(response.data);
  const paginated = unwrapPaginatedResult<ApiProductListItem>(data);
  return {
    ...paginated,
    results: paginated.results.map((item) => normalizeProductListItem(item)),
  };
}

export async function fetchTrendingProductItems(limit = 8): Promise<ApiProductListItem[]> {
  const { results } = await fetchTrendingProducts({ page: 1, limit });
  return results;
}

export async function fetchProductById(id: number): Promise<ApiProductDetail | null> {
  const response = await apiClient.get(`${API_ENDPOINTS.PRODUCTS}/${id}`);
  const data = unwrapApiPayload<ApiProductDetail & Record<string, unknown>>(response.data);
  if (!data) return null;

  const raw = data as Record<string, unknown>;
  const approvalStatus =
    extractApprovalStatus(raw) ?? parseApprovalStatus(data.approval_status);

  return {
    ...data,
    approval_status: approvalStatus,
    review_version:
      typeof raw.review_version === "number"
        ? raw.review_version
        : (data.review_version ?? null),
    latest_review_remarks:
      typeof raw.latest_review_remarks === "string"
        ? raw.latest_review_remarks
        : (data.latest_review_remarks ?? null),
    submitted_at:
      typeof raw.submitted_at === "string" ? raw.submitted_at : (data.submitted_at ?? null),
    resubmitted_at:
      typeof raw.resubmitted_at === "string"
        ? raw.resubmitted_at
        : (data.resubmitted_at ?? null),
    reviewed_at:
      typeof raw.reviewed_at === "string" ? raw.reviewed_at : (data.reviewed_at ?? null),
    reviewed_by:
      typeof raw.reviewed_by === "number" ? raw.reviewed_by : (data.reviewed_by ?? null),
  };
}

export async function fetchRelatedProducts(
  params: RelatedProductsParams
): Promise<PaginatedResult<ApiProductListItem>> {
  const sellerId = params.seller_id ?? getLoggedInUserId();
  const response = await apiClient.get(`${API_ENDPOINTS.PRODUCTS}/related`, {
    params: {
      product_id: params.product_id,
      subcategory_id: params.subcategory_id,
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      sort_by: params.sort_by ?? "name",
      sort_order: params.sort_order ?? "asc",
      ...(sellerId ? { seller_id: sellerId } : {}),
    },
  });
  const data = unwrapApiPayload<unknown>(response.data);
  const paginated = unwrapPaginatedResult<ApiProductListItem>(data);
  return {
    ...paginated,
    results: paginated.results.map((item) => normalizeProductListItem(item)),
  };
}
