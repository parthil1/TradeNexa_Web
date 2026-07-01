import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/config/endpoints";
import { unwrapApiPayload } from "@/utils/authHelpers";
import type { ApiRole } from "@/types/roles";

export async function fetchRoles(): Promise<ApiRole[]> {
  const response = await apiClient.get(API_ENDPOINTS.ROLES);
  const data = unwrapApiPayload<ApiRole[]>(response.data);
  return Array.isArray(data) ? data : [];
}
