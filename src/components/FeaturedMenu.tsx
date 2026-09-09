import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Product, effectivePrice, hasDiscount } from "@/types/menu";
import { formatCurrency } from "@/lib/format";
import { ArrowRight } from "lucide-react";

export const FeaturedMenu = () => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .limit(6)
      .then(({ data }) => setProducts(data ?? []));
  }, []);

  return (
    <section id="cardapio" className="py-20 md:py-28 bg-background">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <span className="font-hand text-primary text-2xl">Direto da chapa</span>
            <h2 className="text-4xl md:text-5xl">Cardápio em Destaque</h2>
          </div>
          <Button variant="outline" className="border-2 w-fit" asChild>
            <Link to="/cardapio">
              Ver cardápio completo <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Link
              key={product.id}
              to="/cardapio"
              className="group block bg-card border border-border rounded-lg overflow-hidden hover:border-primary hover:-translate-y-1 transition-all duration-300 hover:shadow-card"
            >
              <div className="h-44 bg-muted overflow-hidden">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-4xl">🐷</div>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-display text-xl tracking-wide mb-2 group-hover:text-primary transition-colors">
                  {product.name}
                </h3>
                {product.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {product.description}
                  </p>
                )}
                <div className="flex items-baseline gap-2">
                  {hasDiscount(product) && (
                    <span className="text-sm text-muted-foreground line-through">
                      {formatCurrency(product.price)}
                    </span>
                  )}
                  <span className="text-lg font-bold text-primary">
                    {formatCurrency(effectivePrice(product))}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
