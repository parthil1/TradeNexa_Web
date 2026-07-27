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

/**
 * Category/subcategory taxonomy is slow-changing but was previously re-scanned
 * page by page on every slug lookup. These module-level caches collapse those
 * repeated scans into one request set per TTL, shared by all callers.
 */
const TAXONOMY_TTL_MS = 5 * 60 * 1000;

interface TaxonomyCacheEntry<T> {
  at: number;
  promise: Promise<T>;
}

let allCategoriesCache: TaxonomyCacheEntry<ApiCategory[]> | null = null;
const subcategoriesCache = new Map<number, TaxonomyCacheEntry<ApiSubcategory[]>>();

function isFresh(entry: TaxonomyCacheEntry<unknown> | null | undefined): boolean {
  return Boolean(entry) && Date.now() - (entry as TaxonomyCacheEntry<unknown>).at < TAXONOMY_TTL_MS;
}

/** All active categories, paginated eagerly and cached. */
function loadAllActiveCategories(): Promise<ApiCategory[]> {
  if (isFresh(allCategoriesCache)) return allCategoriesCache!.promise;

  const promise = (async () => {
    const limit = 50;
    const first = await fetchCategories({ page: 1, limit, is_active: true });
    const totalPages = Math.min(first.pagination.totalPages || 1, 10);
    if (totalPages <= 1) return first.results;

    // Remaining pages in parallel — previously these were awaited one by one.
    const rest = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) =>
        fetchCategories({ page: i + 2, limit, is_active: true })
      )
    );
    return [first.results, ...rest.map((r) => r.results)].flat();
  })().catch((err) => {
    allCategoriesCache = null;
    throw err;
  });

  allCategoriesCache = { at: Date.now(), promise };
  return promise;
}

/** All active subcategories for one category, paginated eagerly and cached. */
function loadAllSubcategories(categoryId: number): Promise<ApiSubcategory[]> {
  const cached = subcategoriesCache.get(categoryId);
  if (isFresh(cached)) return cached!.promise;

  const promise = (async () => {
    const limit = 50;
    const first = await fetchSubcategories(categoryId, { page: 1, limit });
    const totalPages = Math.min(first.pagination.totalPages || 1, 20);
    if (totalPages <= 1) return first.results;

    const rest = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) =>
        fetchSubcategories(categoryId, { page: i + 2, limit })
      )
    );
    return [first.results, ...rest.map((r) => r.results)].flat();
  })().catch((err) => {
    subcategoriesCache.delete(categoryId);
    throw err;
  });

  subcategoriesCache.set(categoryId, { at: Date.now(), promise });
  return promise;
}

export async function fetchCategoryBySlug(slug: string): Promise<ApiCategoryDetail | null> {
  const categories = await loadAllActiveCategories();
  const match = categories.find((c) => c.slug === slug);
  return match ? fetchCategoryById(match.id) : null;
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
  const subs = await loadAllSubcategories(categoryId);
  return subs.find((s) => s.slug === subSlug && s.is_active) ?? null;
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

  const subs = await loadAllSubcategories(categoryId);
  const sub = subs.find((s) => s.id === subcategoryId && s.is_active);
  if (sub) {
    return {
      ...base,
      subcategoryHref: `/categories/${detail.slug}/${sub.slug}`,
      subcategoryName: sub.name,
    };
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
  const categories = await loadAllActiveCategories();

  // Fan out across categories instead of walking them (and their subcategory
  // pages) one at a time — the sequential version could issue hundreds of
  // serial requests before resolving a single slug redirect.
  const perCategory = await Promise.all(
    categories.map(async (cat) => {
      try {
        const subs = await loadAllSubcategories(cat.id);
        const match = subs.find((s) => s.id === subcategoryId && s.is_active);
        return match ? { categoryId: cat.id, subcategory: match } : null;
      } catch {
        return null;
      }
    })
  );

  const hit = perCategory.find((entry) => entry !== null);
  if (!hit) return null;

  const detail = await fetchCategoryById(hit.categoryId);
  return detail ? { category: detail, subcategory: hit.subcategory } : null;
}

export async function fetchProducts(
  params?: ProductListParams
): Promise<PaginatedResult<ApiProductListItem>> {
  // Only filter by seller when explicitly requested — never default to the
  // logged-in user id (that broke buyer category / search browsing).
  const response = await apiClient.get(API_ENDPOINTS.PRODUCTS, {
    params: buildParams(params),
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
  const query: Record<string, string | number> = {
    page: params?.page ?? 1,
    limit: params?.limit ?? 10,
    sort_by: params?.sort_by ?? "name",
    sort_order: params?.sort_order ?? "asc",
  };
  if (params?.search?.trim()) query.search = params.search.trim();
  if (params?.city_id) query.city_id = params.city_id;
  if (params?.seller_id) query.seller_id = params.seller_id;

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
  const response = await apiClient.get(`${API_ENDPOINTS.PRODUCTS}/related`, {
    params: {
      product_id: params.product_id,
      subcategory_id: params.subcategory_id,
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      sort_by: params.sort_by ?? "name",
      sort_order: params.sort_order ?? "asc",
      ...(params.seller_id ? { seller_id: params.seller_id } : {}),
    },
  });
  const data = unwrapApiPayload<unknown>(response.data);
  const paginated = unwrapPaginatedResult<ApiProductListItem>(data);
  return {
    ...paginated,
    results: paginated.results.map((item) => normalizeProductListItem(item)),
  };
}
