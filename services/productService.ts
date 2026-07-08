import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/config/endpoints";
import { unwrapApiPayload } from "@/utils/authHelpers";
import { buildProductFormData } from "@/utils/buildProductFormData";
import type { ApiCreatedProduct, CreateProductFormData } from "@/types/product";

export async function createProduct(data: CreateProductFormData): Promise<ApiCreatedProduct> {
  const formData = buildProductFormData(data);
  const response = await apiClient.post(API_ENDPOINTS.PRODUCTS, formData);
  const payload = unwrapApiPayload<ApiCreatedProduct>(response.data);
  return payload;
}
