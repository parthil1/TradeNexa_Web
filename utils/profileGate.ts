/**
 * Portal routes that require `is_completed_profile === true`.
 * Products / catalog / RFQ / inquiry areas open the complete-profile modal instead.
 */
const PROFILE_REQUIRED_PREFIXES = [
  // Buyer — products & catalog browsing
  "/buyer/search",
  "/buyer/product",
  "/buyer/trending-products",
  "/buyer/categories",
  "/buyer/category",
  "/buyer/suppliers",
  "/buyer/supplier",
  "/buyer/wishlist",
  // Buyer — RFQs
  "/buyer/inquiries",
  "/buyer/rfq",
  "/buyer/post-requirement",
  // Buyer — product inquiries
  "/buyer/product-inquiries",
  "/buyer/send-inquiry",
  // Buyer — chats
  "/buyer/chats",
  // Seller — catalog / products
  "/seller/catalog",
  "/seller/add-product",
  "/seller/edit-product",
  "/seller/product",
  // Seller — RFQs / leads
  "/seller/leads",
  "/seller/lead",
  "/seller/quotations",
  // Seller — inquiries
  "/seller/inquiries",
  // Seller — chats
  "/seller/chats",
] as const;

export function requiresCompletedProfile(pathname: string): boolean {
  const path = pathname.split("?")[0] || pathname;
  return PROFILE_REQUIRED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}

export function isUserProfileComplete(user: {
  isCompletedProfile?: boolean;
} | null | undefined): boolean {
  return user?.isCompletedProfile === true;
}
