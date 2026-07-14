import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/config/endpoints";
import { unwrapApiPayload } from "@/utils/authHelpers";
import { buildProductFormData } from "@/utils/buildProductFormData";
import { unwrapPaginatedResult } from "@/utils/catalogHelpers";
import { parseApprovalStatus } from "@/utils/productApprovalHelpers";
import type { PaginatedResult } from "@/types/catalog";
import type {
  ApiCreatedProduct,
  ApiProductReview,
  CreateProductFormData,
  ProductReviewAction,
} from "@/types/product";

export interface DeleteProductMediaPayload {
  image_ids?: number[];
  video_ids?: number[];
}

export async function createProduct(data: CreateProductFormData): Promise<ApiCreatedProduct> {
  const formData = buildProductFormData(data);
  const response = await apiClient.post(API_ENDPOINTS.PRODUCTS, formData);
  const payload = unwrapApiPayload<ApiCreatedProduct>(response.data);
  return payload;
}

export async function updateProduct(
  id: number,
  data: CreateProductFormData
): Promise<ApiCreatedProduct> {
  const formData = buildProductFormData(data, { isUpdate: true });
  const response = await apiClient.put(`${API_ENDPOINTS.PRODUCTS}/${id}`, formData);
  const payload = unwrapApiPayload<ApiCreatedProduct>(response.data);
  return payload;
}

/** DELETE /api/v1/products/:id — permanently remove a product listing. */
export async function deleteProduct(productId: number): Promise<void> {
  const response = await apiClient.delete(`${API_ENDPOINTS.PRODUCTS}/${productId}`);
  unwrapApiPayload(response.data);
}

/** DELETE /api/v1/products/:id/media — remove gallery images/videos by server id. */
export async function deleteProductMedia(
  productId: number,
  payload: DeleteProductMediaPayload
): Promise<void> {
  const body: DeleteProductMediaPayload = {};
  if (payload.image_ids?.length) body.image_ids = payload.image_ids;
  if (payload.video_ids?.length) body.video_ids = payload.video_ids;
  if (!body.image_ids?.length && !body.video_ids?.length) return;

  const response = await apiClient.delete(`${API_ENDPOINTS.PRODUCTS}/${productId}/media`, {
    data: body,
  });
  unwrapApiPayload(response.data);
}

function normalizeProductReview(raw: unknown): ApiProductReview | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const id = typeof item.id === "number" ? item.id : Number(item.id);
  const productId = typeof item.product_id === "number" ? item.product_id : Number(item.product_id);
  if (!Number.isFinite(id) || !Number.isFinite(productId)) return null;

  return {
    id,
    product_id: productId,
    review_version:
      typeof item.review_version === "number"
        ? item.review_version
        : Number(item.review_version) || 1,
    action: (typeof item.action === "string" ? item.action : "submitted") as ProductReviewAction,
    from_status: parseApprovalStatus(item.from_status),
    to_status: parseApprovalStatus(item.to_status),
    remarks: typeof item.remarks === "string" ? item.remarks : null,
    actor_id: typeof item.actor_id === "number" ? item.actor_id : null,
    actor_role: typeof item.actor_role === "string" ? item.actor_role : null,
    metadata:
      item.metadata && typeof item.metadata === "object"
        ? (item.metadata as Record<string, unknown>)
        : null,
    created_at: typeof item.created_at === "string" ? item.created_at : "",
  };
}

/** GET /api/v1/products/:id/reviews — append-only moderation timeline */
export async function fetchProductReviews(
  productId: number,
  params?: { page?: number; limit?: number }
): Promise<PaginatedResult<ApiProductReview>> {
  const response = await apiClient.get(`${API_ENDPOINTS.PRODUCTS}/${productId}/reviews`, {
    params: {
      page: params?.page ?? 1,
      limit: params?.limit ?? 20,
    },
  });
  const data = unwrapApiPayload<unknown>(response.data);
  const paginated = unwrapPaginatedResult<unknown>(data);
  return {
    ...paginated,
    results: paginated.results
      .map((item) => normalizeProductReview(item))
      .filter((item): item is ApiProductReview => item != null),
  };
}
