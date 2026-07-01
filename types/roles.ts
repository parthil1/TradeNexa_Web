export interface ApiRole {
  id: number;
  code: string;
  name: string;
  description: string;
  is_active: number | boolean;
  created_at?: string;
  updated_at?: string;
}
