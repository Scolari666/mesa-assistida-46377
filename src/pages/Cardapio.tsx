import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ShoppingCart } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { Category, ProductWithVariations, effectivePrice, hasDiscount } from "@/types/menu";
import { useCart } from "@/contexts/CartContext";
import { ProductOptionsDialog } from "@/components/menu/ProductOptionsDialog";
import { isStoreOpen, type BusinessHours } from "@/lib/businessHours";
import { useStoreSettings } from "@/hooks/useStoreSettings";

type CategoryWithProducts = Category & { products: ProductWithVariations[] };

const Cardapio = () => {
  const [categories, setCategories] = useState<CategoryWithProducts[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithVariations | null>(null);
  const { addItem, itemCount, subtotal } = useCart();
  const { settings } = useStoreSettings();

  useEffect(() => {
    supabase
      .from("categories")
      .select("*, products(*, product_variations(*), product_addons(max_quantity, sort_order, addons(*)))")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        const withActiveProducts = (data ?? []).map((cat) => ({
          ...cat,
          products: (cat.products as ProductWithVariations[])
            .filter((p) => p.active)
            .sort((a, b) => a.sort_order - b.sort_order),
        }));
        setCategories(withActiveProducts.filter((c) => c.products.length > 0));
        setLoading(false);
      });
  }, []);

  const storeOpen = useMemo(() => {
    if (!settings) return true;
    return isStoreOpen(settings.business_hours as unknown as BusinessHours);
  }, [settings]);

  const handleAdd = (product: ProductWithVariations) => {
    const hasVariations = product.product_variations.some((v) => v.active);
    const hasAddons = product.product_addons.length > 0;
    if (hasVariations || hasAddons) {
      setSelectedProduct(product);
      return;
    }
    addItem({
      productId: product.id,
      productName: product.name,
      imageUrl: product.image_url,
      unitPrice: effectivePrice(product),
      variationId: null,
      variationName: null,
      addons: [],
    });
  };

  return (
    <>
      <Helmet>
        <title>Cardápio - Porks Santa Maria</title>
      </Helmet>

      <div className="min-h-screen bg-background pb-28">
        <Navbar />

        <header className="border-b border-border">
          <div className="container px-4 md:px-6 py-8 text-center">
            <span className="font-hand text-primary text-2xl">Escolha e peça</span>
            <h1 className="text-4xl md:text-5xl">Cardápio</h1>
            {!storeOpen && (
              <p className="mt-3 inline-block bg-muted text-muted-foreground text-sm px-4 py-2 rounded-full">
                Estamos fechados no momento. Você pode montar o pedido, mas ele só será
                enviado quando abrirmos.
              </p>
            )}
          </div>
        </header>

        {categories.length > 0 && (
          <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-lg border-b border-border overflow-x-auto">
            <div className="container px-4 py-3 flex gap-2">
              {categories.map((cat) => (
                <a
                  key={cat.id}
                  href={`#cat-${cat.id}`}
                  className="whitespace-nowrap text-sm font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full border border-border hover:border-primary hover:text-primary transition-colors"
                >
                  {cat.name}
                </a>
              ))}
            </div>
          </div>
        )}

        <main className="container px-4 md:px-6 py-8 space-y-12">
          {loading && <p className="text-center text-muted-foreground py-12">Carregando cardápio...</p>}
          {!loading && categories.length === 0 && (
            <p className="text-center text-muted-foreground py-12">Cardápio indisponível no momento.</p>
          )}

          {categories.map((cat) => (
            <section key={cat.id} id={`cat-${cat.id}`} className="scroll-mt-32">
              <h2 className="text-3xl mb-6">{cat.name}</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {cat.products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary transition-colors flex flex-col"
                  >
                    <div className="h-40 bg-muted overflow-hidden relative">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-4xl">🐷</div>
                      )}
                      {product.is_combo && (
                        <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">Combo</Badge>
                      )}
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="font-display text-lg tracking-wide mb-1">{product.name}</h3>
                      {product.description && (
                        <p className="text-sm text-muted-foreground mb-3 flex-1">{product.description}</p>
                      )}
                      <div className="flex items-center justify-between mt-auto pt-2">
                        <div className="flex items-baseline gap-2">
                          {hasDiscount(product) && (
                            <span className="text-xs text-muted-foreground line-through">
                              {formatCurrency(product.price)}
                            </span>
                          )}
                          <span className="font-bold text-primary">
                            {product.product_variations.filter((v) => v.active).length > 0
                              ? `a partir de ${formatCurrency(
                                  Math.min(...product.product_variations.filter((v) => v.active).map((v) => v.price))
                                )}`
                              : formatCurrency(effectivePrice(product))}
                          </span>
                        </div>
                        <Button size="icon" onClick={() => handleAdd(product)} aria-label={`Adicionar ${product.name}`}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </main>

        <Footer />

        {itemCount > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
            <Button
              asChild
              size="lg"
              className="w-full max-w-2xl mx-auto flex items-center justify-between font-display text-lg tracking-wide shadow-glow"
            >
              <Link to="/carrinho">
                <span className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Ver Carrinho ({itemCount})
                </span>
                <span>{formatCurrency(subtotal)}</span>
              </Link>
            </Button>
          </div>
        )}
      </div>

      <ProductOptionsDialog
        product={selectedProduct}
        open={!!selectedProduct}
        onOpenChange={(open) => !open && setSelectedProduct(null)}
      />
    </>
  );
};

export default Cardapio;
