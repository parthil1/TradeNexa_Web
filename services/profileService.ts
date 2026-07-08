import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/config/endpoints";
import {
  getSellerIdFromProfile,
  unwrapApiPayload,
  type ApiUserProfile,
} from "@/utils/authHelpers";

/** GET /api/v1/auth/profile — requires Bearer access token */
export async function fetchProfile(): Promise<ApiUserProfile> {
  const response = await apiClient.get(API_ENDPOINTS.PROFILE);
  return unwrapApiPayload<ApiUserProfile>(response.data);
}

/** DELETE /api/v1/auth/profile — requires Bearer access token */
export async function deleteProfile(): Promise<void> {
  const response = await apiClient.delete(API_ENDPOINTS.PROFILE);
  unwrapApiPayload(response.data);
}

export async function fetchSellerId(): Promise<number | null> {
  const profile = await fetchProfile();
  return getSellerIdFromProfile(profile);
}
