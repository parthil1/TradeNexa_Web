import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/config/endpoints";
import { unwrapApiPayload } from "@/utils/authHelpers";
import type { ApiBusinessType } from "@/types/businessType";

export async function fetchBusinessTypes(roleId: number): Promise<ApiBusinessType[]> {
  const response = await apiClient.get(API_ENDPOINTS.BUSINESS_TYPES, {
    params: { role_id: roleId },
  });
  const data = unwrapApiPayload<ApiBusinessType[]>(response.data);
  if (!Array.isArray(data)) return [];
  return data.filter((item) => item.is_active);
}
