import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, Tag, ChevronLeft, Plus as PlusIcon } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { useCart } from "@/contexts/CartContext";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { Product, effectivePrice } from "@/types/menu";

const Cart = () => {
  const { items, subtotal, itemCount, incrementItem, decrementItem, removeItem, addItem } = useCart();
  const { settings } = useStoreSettings();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<Product[]>([]);

  useEffect(() => {
    if (items.length === 0) {
      setSuggestions([]);
      return;
    }

    const cartProductIds = items.map((i) => i.productId);

    supabase
      .from("product_suggestions")
      .select("suggested_product_id, sort_order, products!product_suggestions_suggested_product_id_fkey(*)")
      .in("product_id", cartProductIds)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        const rows = (data ?? []) as unknown as Array<{ products: Product | null }>;
        const unique = new Map<string, Product>();
        rows.forEach((row) => {
          const product = row.products;
          if (product && product.active && !cartProductIds.includes(product.id)) {
            unique.set(product.id, product);
          }
        });
        setSuggestions(Array.from(unique.values()).slice(0, 8));
      });
  }, [items]);

  const discountPercent = settings?.online_discount_percent ?? 10;
  const minOrder = settings?.online_discount_min_order ?? 0;
  const qualifiesForDiscount = subtotal >= minOrder;

  return (
    <>
      <Helmet>
        <title>Carrinho - Porks Santa Maria</title>
      </Helmet>

      <div className="min-h-screen bg-background pb-32">
        <Navbar />

        <div className="container px-4 md:px-6 py-6 max-w-3xl">
          <Button variant="ghost" size="sm" className="mb-4 -ml-2" asChild>
            <Link to="/cardapio">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Continuar comprando
            </Link>
          </Button>

          <h1 className="text-3xl md:text-4xl mb-6">Seu Carrinho</h1>

          {items.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🐷</div>
              <p className="text-muted-foreground mb-6">Seu carrinho está vazio.</p>
              <Button asChild className="font-display tracking-wide">
                <Link to="/cardapio">Ver cardápio</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-8">
                {items.map((item) => (
                  <div
                    key={item.key}
                    className="flex gap-4 bg-card border border-border rounded-lg p-3"
                  >
                    <div className="h-20 w-20 flex-shrink-0 rounded-md bg-muted overflow-hidden">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-2xl">🐷</div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold leading-tight">{item.productName}</h3>
                      {item.variationName && (
                        <p className="text-sm text-muted-foreground">{item.variationName}</p>
                      )}
                      <p className="text-primary font-bold mt-1">
                        {formatCurrency(item.unitPrice * item.quantity)}
                      </p>
                    </div>

                    <div className="flex flex-col items-end justify-between">
                      <button
                        onClick={() => removeItem(item.key)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        aria-label={`Remover ${item.productName}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => decrementItem(item.key)}
                          aria-label="Diminuir quantidade"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center font-semibold">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => incrementItem(item.key)}
                          aria-label="Aumentar quantidade"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 bg-primary/10 border border-primary/40 rounded-lg p-4 mb-8">
                <div className="bg-primary rounded-full p-2 flex-shrink-0">
                  <Tag className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold">
                    Pague online e ganhe {Number(discountPercent).toFixed(0)}% de desconto
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {qualifiesForDiscount
                      ? "Escolha Pix ou cartão na etapa de pagamento para aplicar o desconto."
                      : `Válido em pedidos a partir de ${formatCurrency(Number(minOrder))}.`}
                  </p>
                </div>
              </div>

              {suggestions.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl mb-4">Peça também</h2>
                  <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4">
                    {suggestions.map((product) => (
                      <div
                        key={product.id}
                        className="w-40 flex-shrink-0 bg-card border border-border rounded-lg overflow-hidden"
                      >
                        <div className="h-24 bg-muted overflow-hidden">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-3xl">🐷</div>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="text-sm font-semibold leading-tight line-clamp-2 mb-2 h-10">
                            {product.name}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-primary">
                              {formatCurrency(effectivePrice(product))}
                            </span>
                            <Button
                              size="icon"
                              className="h-7 w-7"
                              aria-label={`Adicionar ${product.name}`}
                              onClick={() =>
                                addItem({
                                  productId: product.id,
                                  productName: product.name,
                                  imageUrl: product.image_url,
                                  unitPrice: effectivePrice(product),
                                  variationId: null,
                                  variationName: null,
                                })
                              }
                            >
                              <PlusIcon className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {items.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border p-4">
            <div className="container max-w-3xl px-0">
              <Button
                size="lg"
                className="w-full flex items-center justify-between font-display text-lg tracking-wide"
                onClick={() => navigate("/identificar")}
              >
                <span>Avançar ({itemCount} {itemCount === 1 ? "item" : "itens"})</span>
                <span>{formatCurrency(subtotal)}</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Cart;
