import type { PaginatedResult } from "@/types/catalog";

export type BannerRedirectType =
  | "category"
  | "subcategory"
  | "product"
  | "seller"
  | "external"
  | string;

export interface ApiBanner {
  id: number;
  title: string;
  image: string;
  redirect_type: BannerRedirectType;
  redirect_id: number | null;
  priority: number;
  is_active: boolean;
  created_by?: number | null;
  updated_by?: number | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface BannerListParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  search?: string;
  is_active?: boolean;
}

export type BannerListResult = PaginatedResult<ApiBanner>;
