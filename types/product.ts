export type ProductCondition = "NEW" | "USED" | "REFURBISHED";
export type StockStatus = "IN_STOCK" | "OUT_OF_STOCK" | "LIMITED" | "MADE_TO_ORDER";

/** Product moderation state — see Product_Approval_Workflow.pdf */
export type ProductApprovalStatus =
  | "in_review"
  | "revision_required"
  | "approved"
  | "rejected";

export type ProductReviewAction =
  | "submitted"
  | "resubmitted"
  | "approved"
  | "revision_required"
  | "rejected";

export interface ProductApprovalFields {
  approval_status: ProductApprovalStatus | null;
  review_version?: number | null;
  submitted_at?: string | null;
  resubmitted_at?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: number | null;
  latest_review_remarks?: string | null;
}

export interface ApiProductReview {
  id: number;
  product_id: number;
  review_version: number;
  action: ProductReviewAction;
  from_status: ProductApprovalStatus | null;
  to_status: ProductApprovalStatus | null;
  remarks: string | null;
  actor_id: number | null;
  actor_role: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface ProductSpecificationRow {
  key: string;
  value: string;
}

/** Fields for POST /api/v1/products — matches Postman form-data schema. */
export interface CreateProductFormData {
  thumbnail: File | null;
  images: File[];
  videos: File[];
  name: string;
  categoryId: number;
  subcategoryId: number;
  brandId: number;
  shortDescription: string;
  description: string;
  price: string;
  currency: string;
  moq: string;
  unit: string;
  material: string;
  countryOfOrigin: string;
  productCondition: ProductCondition;
  stockStatus: StockStatus;
  showPrice: boolean;
  acceptInquiry: boolean;
  isActive: boolean;
  sellerId: number;
  warranty: string;
  stockQuantity: string;
  hsnCode: string;
  gstPercentage: string;
  searchTags: string;
  specifications: ProductSpecificationRow[];
  isTrending: boolean;
  rating: string;
}

export interface ApiCreatedProduct {
  id: number;
  name: string;
  slug?: string;
  approval_status?: ProductApprovalStatus;
  review_version?: number;
}

export interface ExistingMediaItem {
  id: number;
  url: string;
}

export interface ExistingProductMedia {
  thumbnail: ExistingMediaItem | null;
  galleryImages: ExistingMediaItem[];
  videos: ExistingMediaItem[];
}

export interface RemovedProductMediaIds {
  imageIds: number[];
  videoIds: number[];
}

export const EMPTY_EXISTING_PRODUCT_MEDIA: ExistingProductMedia = {
  thumbnail: null,
  galleryImages: [],
  videos: [],
};

export const EMPTY_REMOVED_PRODUCT_MEDIA_IDS: RemovedProductMediaIds = {
  imageIds: [],
  videoIds: [],
};
