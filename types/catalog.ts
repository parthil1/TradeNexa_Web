export interface ApiPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  results: T[];
  pagination: ApiPagination;
}

export interface ApiCategory {
  id: number;
  name: string;
  icon: string | null;
  image: string | null;
  slug: string;
  is_active: boolean;
  subcategory_count?: number;
  product_count?: number;
}

export interface ApiCategoryDetail extends ApiCategory {
  parent_id?: number | null;
  subcategories?: ApiSubcategory[];
  created_at?: string;
  updated_at?: string;
}

export interface ApiSubcategory {
  id: number;
  name: string;
  icon: string | null;
  image: string | null;
  slug: string;
  is_active: boolean;
  product_count?: number;
  category_id: number;
}

export interface ApiProductListItem {
  id: number;
  name: string;
  slug: string;
  thumbnail: string | null;
  price: number;
  currency: string;
  moq: number;
  unit: string;
  supplier_name: string;
  verified: boolean;
  rating: number;
  city: string | null;
  state: string | null;
  is_trending: boolean;
  created_at: string;
  subcategory_id?: number | null;
  subcategory_name?: string | null;
  /** Present when the products list API is called with an access token */
  is_wishlist?: boolean;
}

export interface ApiProductMediaItem {
  id?: number;
  url?: string | null;
  image_url?: string | null;
  file?: string | null;
  path?: string | null;
  video_url?: string | null;
  video?: string | null;
  thumbnail?: string | null;
  is_primary?: boolean | null;
}

export interface ApiProductDetail {
  id: number;
  slug: string;
  category_id?: number;
  subcategory_id?: number;
  basic_details: {
    name: string;
    short_description: string | null;
    description: string | null;
    brand: { id: number; name: string } | null;
    category: { id: number; name: string } | null;
    subcategory: { id: number; name: string } | null;
    country_of_origin: string | null;
    material?: string | null;
    product_condition?: string | null;
  };
  pricing: {
    price: number;
    currency?: string | null;
    price_type: string | null;
    minimum_order_quantity: number;
    unit: string;
    gst_percentage: number | null;
    gst_included: boolean | null;
    hsn_code: string | null;
    show_price?: boolean | null;
  };
  inventory?: {
    stock_status?: string | null;
    stock_quantity?: number | null;
  };
  images: {
    thumbnail: string | ApiProductMediaItem | null;
    gallery: Array<string | ApiProductMediaItem>;
  };
  videos: Array<string | ApiProductMediaItem>;
  seller: {
    id: number;
    user_id?: number;
    company?: {
      name: string;
      logo: string | null;
      business_type: string | null;
      year_established: number | null;
      experience_years: number;
    };
    rating: { average: number; total_reviews: number | null };
    contact?: {
      show_phone: boolean | null;
      show_email: boolean | null;
      phone: string | null;
      whatsapp: string | null;
      email: string | null;
      website: string | null;
    };
    location?: {
      address: string | null;
      city: string | null;
      state: string | null;
      country: string | null;
      postal_code: string | null;
      latitude?: number | null;
      longitude?: number | null;
    };
    social_links: { website: string | null; facebook: string | null };
  };
  marketplace: {
    is_featured: boolean | null;
    is_trending: boolean | null;
    is_recommended?: boolean | null;
    is_related?: boolean | null;
    share_url: string | null;
    accept_inquiry?: boolean | null;
    is_active?: boolean | null;
  };
  user_actions?: {
    is_favourite: boolean | null;
    is_inquiry_sent: boolean | null;
    can_contact_seller: boolean | null;
    can_buy: boolean | null;
  };
  ratings: {
    average: number;
    total_reviews: number | null;
    breakdown?: unknown;
  };
  reviews?: unknown;
  created_at: string;
  updated_at: string;
  warranty?: string | null;
  search_tags?: string | string[] | null;
  specifications?: Record<string, string> | string | null;
  /** @deprecated Legacy flat fields — prefer nested API shapes above */
  material?: string | null;
  product_condition?: string | null;
  stock_status?: string | null;
  show_price?: boolean | null;
  accept_inquiry?: boolean | null;
  is_active?: boolean | null;
  currency?: string | null;
  stock_quantity?: number | null;
  rating?: number | null;
}

export interface CatalogListParams {
  page?: number;
  limit?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  is_active?: boolean;
}

export interface ProductListParams extends CatalogListParams {
  category_id?: number;
  subcategory_id?: number;
  brand_id?: number;
  city_id?: number;
  is_trending?: boolean;
  /**
   * Logged-in buyer user id — backend uses this for wishlist / personalization
   * on public product list endpoints.
   */
  seller_id?: number;
}

/** GET /api/v1/products/my — authenticated seller's own listings */
export interface MyProductListParams extends ProductListParams {
  brand_id?: number;
}

export interface RelatedProductsParams extends CatalogListParams {
  product_id: number;
  subcategory_id: number;
  seller_id?: number;
}
