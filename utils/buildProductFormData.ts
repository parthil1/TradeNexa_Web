import type { CreateProductFormData } from "@/types/product";

function appendIfPresent(formData: FormData, key: string, value?: string | null) {
  if (value?.trim()) {
    formData.append(key, value.trim());
  }
}

function appendFile(formData: FormData, key: string, file: File | null) {
  if (file) {
    formData.append(key, file, file.name);
  }
}

function appendBoolean(formData: FormData, key: string, value: boolean) {
  formData.append(key, String(value));
}

function buildSpecificationsObject(rows: CreateProductFormData["specifications"]): Record<string, string> {
  const specs: Record<string, string> = {};
  for (const row of rows) {
    const key = row.key.trim();
    const value = row.value.trim();
    if (key && value) specs[key] = value;
  }
  return specs;
}

/** Matches POST /api/v1/products multipart form (Postman). */
export function buildProductFormData(data: CreateProductFormData): FormData {
  const formData = new FormData();

  // Required
  appendFile(formData, "thumbnail", data.thumbnail);
  formData.append("name", data.name.trim());
  formData.append("category_id", String(data.categoryId));
  formData.append("subcategory_id", String(data.subcategoryId));
  formData.append("brand_id", String(data.brandId));
  formData.append("short_description", data.shortDescription.trim());
  formData.append("price", data.price.trim());
  formData.append("currency", data.currency.trim());
  formData.append("moq", data.moq.trim());
  formData.append("unit", data.unit.trim());
  formData.append("material", data.material.trim());
  formData.append("country_of_origin", data.countryOfOrigin.trim());
  formData.append("product_condition", data.productCondition);
  formData.append("stock_status", data.stockStatus);
  appendBoolean(formData, "show_price", data.showPrice);
  appendBoolean(formData, "accept_inquiry", data.acceptInquiry);
  appendBoolean(formData, "is_active", data.isActive);
  formData.append("seller_id", String(data.sellerId));

  // Optional — only when provided
  data.images.forEach((file) => formData.append("image", file, file.name));
  data.videos.forEach((file) => formData.append("video", file, file.name));
  appendIfPresent(formData, "description", data.description);
  appendIfPresent(formData, "warranty", data.warranty);
  appendIfPresent(formData, "stock_quantity", data.stockQuantity);
  appendIfPresent(formData, "hsn_code", data.hsnCode);
  appendIfPresent(formData, "gst_percentage", data.gstPercentage);
  appendIfPresent(formData, "search_tags", data.searchTags);
  if (data.isTrending) appendBoolean(formData, "is_trending", true);
  appendIfPresent(formData, "rating", data.rating);

  const specifications = buildSpecificationsObject(data.specifications);
  if (Object.keys(specifications).length > 0) {
    formData.append("specifications", JSON.stringify(specifications));
  }

  return formData;
}
