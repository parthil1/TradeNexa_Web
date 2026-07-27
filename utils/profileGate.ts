/**
 * Portal routes that require `is_completed_profile === true`.
 * Opens the complete-profile modal instead of the page.
 *
 * Buyer product/category browsing stays open; inquiry / RFQ / chat actions stay gated.
 */
const PROFILE_REQUIRED_PREFIXES = [
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
  const path = (pathname.split("?")[0] || pathname).replace(/\/+$/, "") || "/";
  return PROFILE_REQUIRED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}

export function isUserProfileComplete(user: {
  isCompletedProfile?: boolean;
} | null | undefined): boolean {
  return user?.isCompletedProfile === true;
}
