import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/config/endpoints";
import { unwrapApiPayload } from "@/utils/authHelpers";
import { unwrapPaginatedResult } from "@/utils/catalogHelpers";
import {
  INDIA_COUNTRY_ID,
  type ApiCity,
  type ApiState,
  type CitiesPageResult,
  type CityListParams,
  type StateListParams,
  type StatesPageResult,
} from "@/types/location";

function buildLocationParams(params?: StateListParams | CityListParams) {
  const query: Record<string, string | number | boolean> = {
    page: params?.page ?? 1,
    limit: params?.limit ?? 20,
    sort_by: params?.sort_by ?? "name",
    sort_order: params?.sort_order ?? "asc",
    is_active: params?.is_active ?? true,
  };
  if (params?.search?.trim()) query.search = params.search.trim();
  return query;
}

export async function fetchStates(params?: StateListParams): Promise<StatesPageResult> {
  const response = await apiClient.get(API_ENDPOINTS.LOCATIONS_STATES, {
    params: {
      ...buildLocationParams(params),
      country_id: params?.country_id ?? INDIA_COUNTRY_ID,
      ...(params?.code?.trim() ? { code: params.code.trim() } : {}),
    },
  });
  const data = unwrapApiPayload<unknown>(response.data);
  return unwrapPaginatedResult<ApiState>(data);
}

export async function fetchCities(params: CityListParams): Promise<CitiesPageResult> {
  const response = await apiClient.get(API_ENDPOINTS.LOCATIONS_CITIES, {
    params: {
      ...buildLocationParams(params),
      state_id: params.state_id,
    },
  });
  const data = unwrapApiPayload<unknown>(response.data);
  return unwrapPaginatedResult<ApiCity>(data);
}
