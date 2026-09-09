import { Tables } from "@/integrations/supabase/types";

export type Category = Tables<"categories">;
export type Product = Tables<"products">;
export type ProductVariation = Tables<"product_variations">;
export type Addon = Tables<"addons">;

export interface ProductAddonLink {
  max_quantity: number;
  sort_order: number;
  addons: Addon;
}

export interface ProductWithVariations extends Product {
  product_variations: ProductVariation[];
  product_addons: ProductAddonLink[];
}

export function effectivePrice(product: Product): number {
  return product.promo_price ?? product.price;
}

export function hasDiscount(product: Product): boolean {
  return product.promo_price != null && product.promo_price < product.price;
}
