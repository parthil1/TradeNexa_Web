import type { ApiProductDetail, ApiProductMediaItem } from "@/types/catalog";
import type {
  CreateProductFormData,
  ExistingMediaItem,
  ExistingProductMedia,
  ProductCondition,
  ProductSpecificationRow,
  StockStatus,
} from "@/types/product";
import { resolveImageUrl } from "@/utils/catalogHelpers";
import { toFormString } from "@/utils/buildProductFormData";

const EMPTY_SPEC: ProductSpecificationRow = { key: "", value: "" };

function parsePositiveId(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (value === 1 || value === "1") return true;
  if (value === 0 || value === "0") return false;
  return fallback;
}

function mediaUrlFromObject(obj: ApiProductMediaItem | Record<string, unknown>): string | null {
  const record = obj as Record<string, unknown>;
  return (
    resolveImageUrl(record.url) ??
    resolveImageUrl(record.image_url) ??
    resolveImageUrl(record.file) ??
    resolveImageUrl(record.path) ??
    resolveImageUrl(record.video_url) ??
    resolveImageUrl(record.video) ??
    resolveImageUrl(record.thumbnail)
  );
}

export function parseApiMediaEntry(entry: unknown): ExistingMediaItem | null {
  if (!entry) return null;

  if (typeof entry === "string") {
    const url = resolveImageUrl(entry);
    return url ? { id: 0, url } : null;
  }

  if (typeof entry === "object") {
    const obj = entry as ApiProductMediaItem;
    const url = mediaUrlFromObject(obj);
    if (!url) return null;
    const id = parsePositiveId(obj.id) ?? 0;
    return { id, url };
  }

  return null;
}

function parseSpecifications(raw: unknown): ProductSpecificationRow[] {
  if (!raw) return [{ ...EMPTY_SPEC }];

  let obj: Record<string, string> = {};
  if (typeof raw === "string") {
    try {
      obj = JSON.parse(raw) as Record<string, string>;
    } catch {
      return [{ ...EMPTY_SPEC }];
    }
  } else if (typeof raw === "object" && raw !== null) {
    obj = raw as Record<string, string>;
  }

  const rows = Object.entries(obj).map(([key, value]) => ({
    key,
    value: toFormString(value),
  }));

  return rows.length > 0 ? rows : [{ ...EMPTY_SPEC }];
}

function readCategoryId(product: ApiProductDetail): number {
  return product.category_id ?? product.basic_details.category?.id ?? 0;
}

function readSubcategoryId(product: ApiProductDetail): number {
  return product.subcategory_id ?? product.basic_details.subcategory?.id ?? 0;
}

function readMaterial(product: ApiProductDetail): string {
  return toFormString(product.basic_details.material ?? product.material);
}

function readProductCondition(product: ApiProductDetail): ProductCondition {
  const raw =
    product.basic_details.product_condition ?? product.product_condition ?? "NEW";
  return raw as ProductCondition;
}

function readCurrency(product: ApiProductDetail): string {
  return toFormString(product.pricing.currency ?? product.currency) || "INR";
}

function readShowPrice(product: ApiProductDetail): boolean {
  return readBoolean(product.pricing.show_price ?? product.show_price, true);
}

function readStockStatus(product: ApiProductDetail): StockStatus {
  const raw =
    product.inventory?.stock_status ?? product.stock_status ?? "IN_STOCK";
  return raw as StockStatus;
}

function readStockQuantity(product: ApiProductDetail): string {
  return toFormString(product.inventory?.stock_quantity ?? product.stock_quantity);
}

function readAcceptInquiry(product: ApiProductDetail): boolean {
  return readBoolean(
    product.marketplace.accept_inquiry ?? product.accept_inquiry,
    true
  );
}

function readIsActive(product: ApiProductDetail): boolean {
  return readBoolean(product.marketplace.is_active ?? product.is_active, true);
}

function readSearchTags(product: ApiProductDetail): string {
  return toFormString(product.search_tags);
}

function readRating(product: ApiProductDetail): string {
  if (product.rating != null) return toFormString(product.rating);
  return toFormString(product.ratings.average);
}

export function mapProductDetailToFormData(
  product: ApiProductDetail,
  sellerId: number
): CreateProductFormData {
  return {
    thumbnail: null,
    images: [],
    videos: [],
    name: toFormString(product.basic_details.name),
    categoryId: readCategoryId(product),
    subcategoryId: readSubcategoryId(product),
    brandId: product.basic_details.brand?.id ?? 0,
    shortDescription: toFormString(product.basic_details.short_description),
    description: toFormString(product.basic_details.description),
    price: toFormString(product.pricing.price),
    currency: readCurrency(product),
    moq: toFormString(product.pricing.minimum_order_quantity),
    unit: toFormString(product.pricing.unit) || "pcs",
    material: readMaterial(product),
    countryOfOrigin: toFormString(product.basic_details.country_of_origin) || "India",
    productCondition: readProductCondition(product),
    stockStatus: readStockStatus(product),
    showPrice: readShowPrice(product),
    acceptInquiry: readAcceptInquiry(product),
    isActive: readIsActive(product),
    sellerId: product.seller?.id ?? sellerId,
    warranty: toFormString(product.warranty),
    stockQuantity: readStockQuantity(product),
    hsnCode: toFormString(product.pricing.hsn_code),
    gstPercentage: toFormString(product.pricing.gst_percentage),
    searchTags: readSearchTags(product),
    specifications: parseSpecifications(product.specifications),
    isTrending: product.marketplace.is_trending ?? false,
    rating: readRating(product),
  };
}

export function extractExistingProductMedia(product: ApiProductDetail): ExistingProductMedia {
  const thumbnail = parseApiMediaEntry(product.images.thumbnail);
  const galleryImages = (product.images.gallery ?? [])
    .map(parseApiMediaEntry)
    .filter((item): item is ExistingMediaItem => Boolean(item));
  const videos = (product.videos ?? [])
    .map(parseApiMediaEntry)
    .filter((item): item is ExistingMediaItem => Boolean(item));

  return { thumbnail, galleryImages, videos };
}

export function existingGalleryUrls(media: ExistingProductMedia): string[] {
  return media.galleryImages.map((item) => item.url);
}

export function existingVideoUrls(media: ExistingProductMedia): string[] {
  return media.videos.map((item) => item.url);
}

export function existingThumbnailUrl(media: ExistingProductMedia): string | null {
  return media.thumbnail?.url ?? null;
}
