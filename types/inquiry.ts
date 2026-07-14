import type { ApiPagination, PaginatedResult } from "@/types/catalog";

export type InquiryStatus =
  | "pending"
  | "quoted"
  | "rejected"
  | "accepted"
  | "cancelled"
  | "closed";

export type InquiryQuotationStatus =
  | "SUBMITTED"
  | "UPDATED"
  | "ACCEPTED"
  | "REJECTED"
  | "WITHDRAWN"
  | string;

export interface ApiInquiryProduct {
  id: number;
  name?: string | null;
  slug?: string | null;
  thumbnail?: string | null;
  price?: number | null;
  currency?: string | null;
  unit?: string | null;
  moq?: number | null;
}

export interface ApiInquiryParty {
  id: number;
  full_name?: string | null;
  email?: string | null;
  company_name?: string | null;
  company_logo?: string | null;
  profile_image?: string | null;
}

export interface ApiInquiryQuotation {
  id: number;
  quotation_number?: string | null;
  inquiry_id?: number | null;
  seller_id?: number | null;
  price?: number | null;
  quantity?: number | null;
  unit?: string | null;
  gst_percentage?: number | null;
  gst_amount?: number | null;
  transportation_charge?: number | null;
  total_amount?: number | null;
  delivery_days?: number | null;
  payment_terms?: string | null;
  validity_days?: number | null;
  remarks?: string | null;
  attachment?: string | null;
  status?: InquiryQuotationStatus | null;
  seller_name?: string | null;
  company_name?: string | null;
  /** Present on seller quotation list */
  inquiry_number?: string | null;
  inquiry_status?: InquiryStatus | null;
  product_id?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ApiInquiry {
  id: number;
  inquiry_number?: string | null;
  product_id: number;
  product?: ApiInquiryProduct | null;
  buyer?: ApiInquiryParty | null;
  seller?: ApiInquiryParty | null;
  buyer_id?: number | null;
  seller_id?: number | null;
  quantity: number;
  unit?: string | null;
  message?: string | null;
  expected_price?: number | null;
  currency?: string | null;
  required_before?: string | null;
  status: InquiryStatus;
  reject_reason?: string | null;
  viewed_at?: string | null;
  responded_at?: string | null;
  is_active?: boolean | null;
  conversation_id?: number | null;
  quotation?: ApiInquiryQuotation | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CreateInquiryPayload {
  product_id: number;
  quantity: number;
  message: string;
  unit?: string;
  expected_price?: number;
  currency?: string;
  required_before?: string;
}

export interface UpdateInquiryPayload {
  quantity?: number;
  message?: string;
  unit?: string;
  expected_price?: number;
  currency?: string;
  required_before?: string;
}

export interface CreateInquiryQuotationPayload {
  price: number;
  quantity?: number;
  unit?: string;
  gst_percentage?: number;
  transportation_charge?: number;
  delivery_days?: number;
  payment_terms?: string;
  validity_days?: number;
  remarks?: string;
}

export type UpdateInquiryQuotationPayload = Partial<CreateInquiryQuotationPayload>;

export interface RejectInquiryPayload {
  reason?: string;
  reject_reason?: string;
}

export interface InquiryListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: InquiryStatus;
  product_id?: number;
  inquiry_id?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export type InquiryListResult = PaginatedResult<ApiInquiry>;
export type InquiryQuotationListResult = PaginatedResult<ApiInquiryQuotation>;

export type { ApiPagination };
