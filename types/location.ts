import type { CatalogListParams, PaginatedResult } from "@/types/catalog";

export interface ApiState {
  id: number;
  country_id: number;
  name: string;
  code: string | null;
  is_active: boolean | number;
  created_at?: string;
}

export interface ApiCity {
  id: number;
  state_id: number;
  name: string;
  is_active: boolean | number;
  created_at?: string;
}

export interface StateListParams extends CatalogListParams {
  country_id?: number;
  code?: string;
}

export interface CityListParams extends CatalogListParams {
  state_id: number;
}

export type StatesPageResult = PaginatedResult<ApiState>;
export type CitiesPageResult = PaginatedResult<ApiCity>;

/** India — matches locations API `country_id=1`. */
export const INDIA_COUNTRY_ID = 1;
