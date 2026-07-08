export interface ApiBusinessType {
  id: number;
  name: string;
  code: string;
  role_id?: number;
  is_active?: number | boolean;
  created_at?: string;
  updated_at?: string;
  role_code?: string;
  role_name?: string;
}
