import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/config/endpoints";
import { unwrapApiPayload } from "@/utils/authHelpers";

export async function deleteProfile(): Promise<void> {
  const response = await apiClient.delete(API_ENDPOINTS.PROFILE);
  unwrapApiPayload(response.data);
}
