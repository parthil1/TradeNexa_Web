import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/config/endpoints";
import { unwrapApiPayload } from "@/utils/authHelpers";
import { unwrapPaginatedResult } from "@/utils/catalogHelpers";
import type {
  ApiSupplier,
  SupplierListParams,
  SupplierListResult,
} from "@/types/supplier";

function pickString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  return null;
}

function pickNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function normalizeSupplier(raw: unknown): ApiSupplier | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const id = pickNumber(item.id);
  const companyName =
    pickString(item.company_name) ??
    pickString(item.name) ??
    pickString(item.business_name);
  if (id == null || !companyName) return null;

  return {
    id,
    user_id: pickNumber(item.user_id),
    company_name: companyName,
    logo: pickString(item.logo),
    verified: item.verified === true,
    rating: pickNumber(item.rating),
    response_rate: pickNumber(item.response_rate),
    years_in_business: pickNumber(item.years_in_business),
    profile_views_count: pickNumber(item.profile_views_count),
    latitude: pickNumber(item.latitude),
    longitude: pickNumber(item.longitude),
    city: pickString(item.city),
    state: pickString(item.state),
    is_active: typeof item.is_active === "boolean" ? item.is_active : null,
  };
}

/** GET /api/v1/suppliers/:id — seller profile details */
export async function fetchSupplierById(id: number): Promise<ApiSupplier> {
  const response = await apiClient.get(`${API_ENDPOINTS.SUPPLIERS}/${id}`);
  const data = unwrapApiPayload<unknown>(response.data);
  const supplier = normalizeSupplier(data);
  if (!supplier) {
    throw new Error("Seller details could not be loaded");
  }
  return supplier;
}

/** GET /api/v1/suppliers — searchable seller list for private RFQs */
export async function fetchSuppliers(
  params?: SupplierListParams
): Promise<SupplierListResult> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 10;
  const response = await apiClient.get(API_ENDPOINTS.SUPPLIERS, {
    params: {
      page,
      limit,
      sort_by: params?.sort_by ?? "company_name",
      sort_order: params?.sort_order ?? "asc",
      ...(params?.search?.trim() ? { search: params.search.trim() } : {}),
    },
  });
  const data = unwrapApiPayload<unknown>(response.data);
  const paginated = unwrapPaginatedResult<unknown>(data);
  const results = paginated.results
    .map(normalizeSupplier)
    .filter((s): s is ApiSupplier => s !== null);

  return {
    results,
    pagination: {
      ...paginated.pagination,
      page: paginated.pagination.page || page,
      limit: paginated.pagination.limit || limit,
    },
  };
}
