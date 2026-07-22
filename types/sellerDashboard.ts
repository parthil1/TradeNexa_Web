/** GET /api/v1/dashboard/seller */

export type SellerDashboardTopProduct = {
  ranking_method: string;
  id: number;
  name: string;
  slug: string;
  thumbnail: string | null;
  price: number;
  currency: string;
  unit: string;
  moq: number;
  approval_status: string;
  is_active: boolean;
  inquiries_total: number;
  inquiries_pending: number;
  inquiries_quoted: number;
  inquiries_accepted: number;
};

export type SellerDashboardTodaysLeadsBreakdown = {
  inquiries: number;
  rfq_invites: number;
};

export type SellerDashboardData = {
  role: string;
  as_of: string;
  total_products: number;
  todays_leads: number;
  todays_leads_breakdown: SellerDashboardTodaysLeadsBreakdown;
  profile_views: number;
  replies_sent: number;
  top_performing_product: SellerDashboardTopProduct | null;
};
