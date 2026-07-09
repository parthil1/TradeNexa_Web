import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/config/endpoints";
import { unwrapApiPayload } from "@/utils/authHelpers";
import { buildProductFormData } from "@/utils/buildProductFormData";
import type { ApiCreatedProduct, CreateProductFormData } from "@/types/product";

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
