import type { ApiPagination, PaginatedResult } from "@/types/catalog";

export type RfqVisibility = "PUBLIC" | "PRIVATE" | string;
export type RfqStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "OPEN"
  | "CLOSED"
  | "CANCELLED"
  | "EXPIRED"
  | string;

export type QuotationStatus =
  | "PENDING"
  | "SUBMITTED"
  | "ACCEPTED"
  | "REJECTED"
  | "REVISION_REQUESTED"
  | "WITHDRAWN"
  | string;

export interface RfqListParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  search?: string;
  status?: string;
}

export interface ApiRfqListItem {
  id: number;
  title: string;
  description?: string | null;
  status?: RfqStatus | null;
  visibility?: RfqVisibility | null;
  quantity?: number | null;
  unit?: string | null;
  category_id?: number | null;
  subcategory_id?: number | null;
  category_name?: string | null;
  subcategory_name?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  quotation_deadline?: string | null;
  required_before?: string | null;
  expected_price?: number | null;
  budget?: number | null;
  currency?: string | null;
  quotations_count?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  buyer_name?: string | null;
  buyer_company?: string | null;
  product_id?: number | null;
  product_name?: string | null;
}

export interface ApiRfqDetail extends ApiRfqListItem {
  address_line_1?: string | null;
  address_line_2?: string | null;
  pincode?: string | null;
  payment_terms?: string | null;
  product?: { id: number; name?: string; slug?: string } | null;
  category?: { id: number; name?: string } | null;
  subcategory?: { id: number; name?: string } | null;
  buyer?: {
    name?: string;
    company_name?: string;
    city?: string;
    state?: string;
  } | null;
  /** Seller's own quotation on this RFQ (when returned by GET /rfqs/seller/:id). */
  my_quotation?: ApiQuotation | null;
}

export interface ApiQuotation {
  id: number;
  rfq_id?: number | null;
  rfq_status?: string | null;
  status?: QuotationStatus | null;
  price?: number | null;
  quantity?: number | null;
  unit?: string | null;
  gst_percentage?: number | null;
  transportation_charge?: number | null;
  delivery_days?: number | null;
  payment_terms?: string | null;
  validity_days?: number | null;
  remarks?: string | null;
  /** Buyer's message from POST /request-revision (when returned by API). */
  revision_request_remarks?: string | null;
  currency?: string | null;
  total_amount?: number | null;
  seller_name?: string | null;
  seller_company?: string | null;
  seller_id?: number | null;
  buyer_name?: string | null;
  buyer_company?: string | null;
  rfq_title?: string | null;
  product_name?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CreateRfqPayload {
  title: string;
  category_id: number;
  subcategory_id: number;
  description: string;
  quantity: number;
  unit: string;
  quotation_deadline: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  product_id?: number;
  expected_price?: number;
  budget?: number;
  currency?: string;
  required_before?: string;
  payment_terms?: string;
  visibility?: RfqVisibility;
}

export type UpdateRfqPayload = Partial<CreateRfqPayload>;

export interface CreateQuotationPayload {
  price: number;
  quantity: number;
  unit: string;
  gst_percentage?: number;
  transportation_charge?: number;
  delivery_days?: number;
  payment_terms?: string;
  validity_days?: number;
  remarks?: string;
}

/** PUT /rfqs/quotations/:id — partial update (seller) */
export type UpdateQuotationPayload = Partial<CreateQuotationPayload>;

/** POST /rfqs/quotations/:id/request-revision — remarks required */
export interface QuotationRevisionRequestPayload {
  remarks: string;
}

/** POST /rfqs/quotations/:id/revise — price, delivery_days, and remarks required */
export interface ReviseQuotationPayload {
  price: number;
  delivery_days: number;
  remarks: string;
}

export type RfqListResult = PaginatedResult<ApiRfqListItem>;
export type QuotationListResult = PaginatedResult<ApiQuotation>;

export interface RfqPagination extends ApiPagination {}
