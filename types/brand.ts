export interface ApiBrand {
  id: number;
  name: string;
  logo: string | null;
  is_popular?: boolean;
  is_active?: boolean | number;
}
