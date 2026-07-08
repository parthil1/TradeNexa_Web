export interface ProductDetailLinks {
  product: (id: number) => string;
  category: string | null;
  search: string;
  supplier: ((sellerId: number) => string) | null;
  back: { href: string | null; label: string };
  mobileBarClass: string;
  pagePaddingClass: string;
}

export const PORTAL_PRODUCT_LINKS: ProductDetailLinks = {
  product: (id) => `/buyer/product/${id}`,
  category: null,
  search: "/buyer/search",
  supplier: (id) => `/buyer/supplier/${id}`,
  back: { href: null, label: "Back to products" },
  mobileBarClass: "bottom-16",
  pagePaddingClass: "pb-28",
};

/** Seller catalog / add-product flows — back goes to catalog, not browser history */
export function sellerCatalogProductLinks(): ProductDetailLinks {
  return {
    ...PORTAL_PRODUCT_LINKS,
    back: { href: "/seller/catalog", label: "Back to Catalog" },
  };
}

export function websiteProductLinks(categorySlug?: string): ProductDetailLinks {
  return {
    product: (id) => `/products/${id}`,
    category: categorySlug ? `/categories/${categorySlug}` : "/categories",
    search: "/products",
    supplier: null,
    back: { href: "/products", label: "Back to products" },
    mobileBarClass: "bottom-0",
    pagePaddingClass: "pb-24",
  };
}
