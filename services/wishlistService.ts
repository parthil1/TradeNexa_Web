import { fetchProductById } from "@/services/catalogService";
import type { ApiProductDetail, ApiProductListItem } from "@/types/catalog";

export function mapProductDetailToListItem(product: ApiProductDetail): ApiProductListItem {
  return {
    id: product.id,
    name: product.basic_details.name,
    slug: product.slug,
    thumbnail: product.images.thumbnail,
    price: product.pricing.price,
    currency: "INR",
    moq: product.pricing.minimum_order_quantity,
    unit: product.pricing.unit,
    supplier_name: product.seller.company.name,
    verified: true,
    rating: product.ratings.average,
    city: product.seller.location.city,
    state: product.seller.location.state,
    is_trending: product.marketplace.is_trending ?? false,
    created_at: product.created_at,
    subcategory_id: product.basic_details.subcategory?.id ?? null,
    subcategory_name: product.basic_details.subcategory?.name ?? null,
  };
}

export async function fetchWishlistProducts(productIds: number[]): Promise<ApiProductListItem[]> {
  if (productIds.length === 0) return [];

  const results = await Promise.all(
    productIds.map(async (id) => {
      try {
        const product = await fetchProductById(id);
        return product ? mapProductDetailToListItem(product) : null;
      } catch {
        return null;
      }
    })
  );

  return results.filter((item): item is ApiProductListItem => item !== null);
}
