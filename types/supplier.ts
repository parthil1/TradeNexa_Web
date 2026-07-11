import type { ApiPagination, PaginatedResult } from "@/types/catalog";

export interface ApiSupplier {
  id: number;
  user_id?: number | null;
  company_name: string;
  logo?: string | null;
  verified?: boolean;
  rating?: number | null;
  response_rate?: number | null;
  years_in_business?: number | null;
  city?: string | null;
  state?: string | null;
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
