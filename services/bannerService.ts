import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/config/endpoints";
import { unwrapApiPayload } from "@/utils/authHelpers";
import { unwrapPaginatedResult } from "@/utils/catalogHelpers";
import { sortBannersByPriority } from "@/utils/bannerHelpers";
import type { ApiBanner, BannerListParams, BannerListResult } from "@/types/banner";

function buildBannerParams(params?: BannerListParams) {
  const query: Record<string, string | number | boolean> = {
    page: params?.page ?? 1,
    limit: params?.limit ?? 5,
    sort_by: params?.sort_by ?? "priority",
    sort_order: params?.sort_order ?? "desc",
  };
  if (params?.search?.trim()) query.search = params.search.trim();
  if (params?.is_active !== undefined) query.is_active = params.is_active;
  return query;
}

/** GET /api/v1/banners — paginated promotional banners */
export async function fetchBanners(params?: BannerListParams): Promise<BannerListResult> {
  const response = await apiClient.get(API_ENDPOINTS.BANNERS, {
    params: buildBannerParams(params),
  });
  const data = unwrapApiPayload<unknown>(response.data);
  return unwrapPaginatedResult<ApiBanner>(data);
}

/** Active banners for home carousel, sorted by priority (highest first). */
export async function fetchActiveBanners(limit = 10): Promise<ApiBanner[]> {
  const { results } = await fetchBanners({
    page: 1,
    limit,
    sort_by: "priority",
    sort_order: "desc",
    is_active: true,
  });
  return sortBannersByPriority(results);
}
