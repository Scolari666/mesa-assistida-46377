import { Tables } from "@/integrations/supabase/types";

export type Category = Tables<"categories">;
export type Product = Tables<"products">;
export type ProductVariation = Tables<"product_variations">;

export interface ProductWithVariations extends Product {
  product_variations: ProductVariation[];
}

export function effectivePrice(product: Product): number {
  return product.promo_price ?? product.price;
}

export function hasDiscount(product: Product): boolean {
  return product.promo_price != null && product.promo_price < product.price;
}
