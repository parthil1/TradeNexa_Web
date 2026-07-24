import type { ApiPagination, PaginatedResult } from "@/types/catalog";

/** GET /api/v1/suppliers and GET /api/v1/suppliers/:id */
export interface ApiSupplier {
  id: number;
  user_id?: number | null;
  company_name: string;
  industry?: string | null;
  logo?: string | null;
  verified?: boolean;
  rating?: number | null;
  response_rate?: number | null;
  years_in_business?: number | null;
  profile_views_count?: number | null;
  product_count?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  city?: string | null;
  state?: string | null;
  is_active?: boolean | null;
}

export interface SupplierListParams {
  page?: number;
  limit?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export type SupplierListResult = PaginatedResult<ApiSupplier>;

export type { ApiPagination };
