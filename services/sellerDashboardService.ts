import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/config/endpoints";
import { unwrapApiPayload } from "@/utils/authHelpers";
import type { SellerDashboardData } from "@/types/sellerDashboard";

/** GET /api/v1/dashboard/seller */
export async function fetchSellerDashboard(): Promise<SellerDashboardData> {
  const response = await apiClient.get(API_ENDPOINTS.DASHBOARD_SELLER);
  return unwrapApiPayload<SellerDashboardData>(response.data);
}
