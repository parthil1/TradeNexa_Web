import type { ApiProductDetail } from "@/types/catalog";
import { formatListedAgo } from "@/utils/catalogHelpers";

export interface ProductSpecRow {
  label: string;
  value: string;
}

type SellerLocation = ApiProductDetail["seller"]["location"] | null | undefined;

export function formatSellerLocation(location: SellerLocation): string {
  if (!location) return "India";
  const parts = [
    location.address?.trim(),
    location.city,
    location.state,
    location.country,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "India";
}

export function getProductDescription(product: ApiProductDetail): string {
  const { basic_details: basic } = product;
  return (basic.description || basic.short_description || "").trim();
}

export function getSellerContactPhone(product: ApiProductDetail): string | null {
  const contact = product.seller?.contact;
  if (!contact) return null;
  return contact.whatsapp || contact.phone || null;
}

export function getSellerRole(product: ApiProductDetail): string | null {
  return product.seller?.company?.business_type?.trim() || null;
}

export function buildProductSpecs(product: ApiProductDetail): {
  keySpecs: ProductSpecRow[];
  fullSpecs: ProductSpecRow[];
} {
  const { basic_details: basic, pricing, seller, inventory } = product;
  const material = basic.material ?? product.material;
  const productCondition =
    basic.product_condition ?? product.product_condition;
  const stockStatus = inventory?.stock_status ?? product.stock_status;
  const stockQuantity = inventory?.stock_quantity ?? product.stock_quantity;
  const companyName = seller?.company?.name;
  const locationAddress = seller?.location?.address;
  const contactEmail = seller?.contact?.email;
  const contactPhone = seller?.contact?.phone;

  const keySpecs: ProductSpecRow[] = [
    basic.brand && { label: "Brand", value: basic.brand.name },
    basic.subcategory && { label: "Subcategory", value: basic.subcategory.name },
    basic.category && { label: "Category", value: basic.category.name },
    material && { label: "Material", value: material },
    productCondition && { label: "Condition", value: productCondition },
    basic.country_of_origin && { label: "Origin", value: basic.country_of_origin },
    pricing.hsn_code && { label: "HSN Code", value: pricing.hsn_code },
    pricing.price_type && { label: "Price Type", value: pricing.price_type },
    pricing.gst_percentage != null && {
      label: "GST",
      value: `${pricing.gst_percentage}%${pricing.gst_included ? " (incl.)" : ""}`,
    },
  ].filter(Boolean) as ProductSpecRow[];

  const fullSpecs: ProductSpecRow[] = [
    ...keySpecs,
    { label: "Min. Order", value: `${pricing.minimum_order_quantity} ${pricing.unit}` },
    { label: "Unit", value: pricing.unit },
    stockStatus && { label: "Stock Status", value: stockStatus },
    stockQuantity != null && {
      label: "Stock Quantity",
      value: String(stockQuantity),
    },
    product.warranty && { label: "Warranty", value: product.warranty },
    { label: "Listed", value: formatListedAgo(product.created_at) },
    { label: "Last Updated", value: formatListedAgo(product.updated_at) },
    companyName && { label: "Supplier", value: companyName },
    locationAddress && { label: "Supplier Address", value: locationAddress },
    contactEmail && { label: "Supplier Email", value: contactEmail },
    contactPhone && { label: "Supplier Phone", value: contactPhone },
  ].filter(Boolean) as ProductSpecRow[];

  return { keySpecs, fullSpecs };
}

export function getExperienceLabel(product: ApiProductDetail): string {
  const company = product.seller?.company;
  if (!company) return "New";
  if (company.experience_years > 0) return `${company.experience_years} Yrs`;
  if (company.year_established) {
    return `${new Date().getFullYear() - company.year_established}+ Yrs`;
  }
  return "New";
}

export function listedDaysLabel(isoDate: string): string {
  return formatListedAgo(isoDate).replace(/^Listed\s+/i, "");
}
