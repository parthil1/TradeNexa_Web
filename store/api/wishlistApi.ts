import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "@/store/baseQuery";
import { fetchWishlist, toggleWishlistApi } from "@/services/wishlistService";
import { formatApiErrorMessage } from "@/utils/apiErrors";
import type { ApiProductListItem } from "@/types/catalog";
import type { WishlistListParams } from "@/types/wishlist";

export interface WishlistQueryResult {
  results: ApiProductListItem[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

function toQueryError(error: unknown) {
  return {
    error: {
      status: (error as { status?: number })?.status,
      message: formatApiErrorMessage(error, "Wishlist request failed"),
      data: (error as { data?: unknown })?.data,
    },
  };
}

/**
 * Wishlist is plain REST (not socket-driven). Caching + tag invalidation
 * collapses the duplicate GET /wishlist on the wishlist page and the
 * double refresh after every remove.
 */
export const wishlistApi = createApi({
  reducerPath: "wishlistApi",
  baseQuery: axiosBaseQuery(),
  keepUnusedDataFor: 5 * 60,
  tagTypes: ["Wishlist"],
  endpoints: (builder) => ({
    getWishlist: builder.query<WishlistQueryResult, WishlistListParams | void>({
      queryFn: async (arg) => {
        try {
          const page = arg?.page ?? 1;
          const limit = arg?.limit ?? 100;
          const { results, pagination } = await fetchWishlist({
            page,
            limit,
            search: arg?.search,
          });
          return {
            data: {
              results,
              total: pagination.total,
              page: pagination.page,
              totalPages: pagination.totalPages,
              limit: pagination.limit,
            },
          };
        } catch (error) {
          return toQueryError(error);
        }
      },
      providesTags: [{ type: "Wishlist", id: "LIST" }],
    }),

    toggleWishlist: builder.mutation<
      boolean,
      { productId: number; currentlyWishlisted?: boolean }
    >({
      queryFn: async ({ productId, currentlyWishlisted }) => {
        try {
          const next = await toggleWishlistApi(productId, currentlyWishlisted);
          return { data: next };
        } catch (error) {
          return toQueryError(error);
        }
      },
      invalidatesTags: [{ type: "Wishlist", id: "LIST" }],
    }),
  }),
});

export const { useGetWishlistQuery, useToggleWishlistMutation, useLazyGetWishlistQuery } =
  wishlistApi;
