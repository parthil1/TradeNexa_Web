import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "@/store/baseQuery";
import { fetchBrandsPage } from "@/services/brandsService";
import { fetchBusinessTypes } from "@/services/businessTypesService";
import { fetchActiveBanners } from "@/services/bannerService";
import { fetchCategories, fetchSubcategories } from "@/services/catalogService";
import { fetchCities, fetchStates } from "@/services/locationService";
import { fetchRoles } from "@/services/rolesService";
import { formatApiErrorMessage } from "@/utils/apiErrors";
import type { ApiBanner } from "@/types/banner";
import type { ApiBrand } from "@/types/brand";
import type { ApiBusinessType } from "@/types/businessType";
import type { ApiCategory, ApiSubcategory } from "@/types/catalog";
import type { ApiCity, ApiState } from "@/types/location";
import type { ApiRole } from "@/types/roles";

/** One hour — reference data changes rarely, so avoid refetch on every mount. */
const REFERENCE_TTL_SECONDS = 60 * 60;

function toQueryError(error: unknown) {
  return {
    error: {
      status: (error as { status?: number })?.status,
      message: formatApiErrorMessage(error, "Failed to load reference data"),
      data: (error as { data?: unknown })?.data,
    },
  };
}

/**
 * Slow-changing lookup data (categories, brands, roles, locations, banners).
 *
 * These endpoints were previously refetched by every component that needed
 * them, on every mount. Queries here delegate to the existing service
 * functions so response normalization stays in one place; RTK Query only adds
 * caching, deduplication, and shared subscriptions.
 */
export const referenceApi = createApi({
  reducerPath: "referenceApi",
  baseQuery: axiosBaseQuery(),
  keepUnusedDataFor: REFERENCE_TTL_SECONDS,
  refetchOnMountOrArgChange: false,
  refetchOnFocus: false,
  refetchOnReconnect: true,
  tagTypes: ["Category", "Subcategory", "Brand", "BusinessType", "Role", "State", "City", "Banner"],
  endpoints: (builder) => ({
    getCategories: builder.query<ApiCategory[], { limit?: number } | void>({
      queryFn: async (arg) => {
        try {
          const { results } = await fetchCategories({
            page: 1,
            limit: arg?.limit ?? 50,
            is_active: true,
          });
          return { data: results };
        } catch (error) {
          return toQueryError(error);
        }
      },
      providesTags: ["Category"],
    }),

    getSubcategories: builder.query<ApiSubcategory[], number>({
      queryFn: async (categoryId) => {
        try {
          const { results } = await fetchSubcategories(categoryId, { page: 1, limit: 50 });
          return { data: results };
        } catch (error) {
          return toQueryError(error);
        }
      },
      providesTags: (_result, _error, categoryId) => [
        { type: "Subcategory" as const, id: categoryId },
      ],
    }),

    getBrands: builder.query<ApiBrand[], { limit?: number } | void>({
      queryFn: async (arg) => {
        try {
          const { results } = await fetchBrandsPage(1, arg?.limit ?? 50);
          return { data: results };
        } catch (error) {
          return toQueryError(error);
        }
      },
      providesTags: ["Brand"],
    }),

    getBusinessTypes: builder.query<ApiBusinessType[], number>({
      queryFn: async (roleId) => {
        try {
          return { data: await fetchBusinessTypes(roleId) };
        } catch (error) {
          return toQueryError(error);
        }
      },
      providesTags: (_result, _error, roleId) => [
        { type: "BusinessType" as const, id: roleId },
      ],
    }),

    getRoles: builder.query<ApiRole[], void>({
      queryFn: async () => {
        try {
          return { data: await fetchRoles() };
        } catch (error) {
          return toQueryError(error);
        }
      },
      providesTags: ["Role"],
    }),

    getStates: builder.query<ApiState[], { search?: string; limit?: number } | void>({
      queryFn: async (arg) => {
        try {
          const { results } = await fetchStates({
            page: 1,
            limit: arg?.limit ?? 50,
            search: arg?.search,
          });
          return { data: results };
        } catch (error) {
          return toQueryError(error);
        }
      },
      providesTags: ["State"],
    }),

    getCities: builder.query<ApiCity[], { stateId: number; search?: string; limit?: number }>({
      queryFn: async ({ stateId, search, limit }) => {
        try {
          const { results } = await fetchCities({
            state_id: stateId,
            page: 1,
            limit: limit ?? 50,
            search,
          });
          return { data: results };
        } catch (error) {
          return toQueryError(error);
        }
      },
      providesTags: (_result, _error, { stateId }) => [{ type: "City" as const, id: stateId }],
    }),

    getActiveBanners: builder.query<ApiBanner[], { limit?: number } | void>({
      queryFn: async (arg) => {
        try {
          return { data: await fetchActiveBanners(arg?.limit ?? 10) };
        } catch (error) {
          return toQueryError(error);
        }
      },
      // Banners rotate more often than other reference data.
      keepUnusedDataFor: 5 * 60,
      providesTags: ["Banner"],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetSubcategoriesQuery,
  useGetBrandsQuery,
  useGetBusinessTypesQuery,
  useGetRolesQuery,
  useGetStatesQuery,
  useGetCitiesQuery,
  useGetActiveBannersQuery,
} = referenceApi;
