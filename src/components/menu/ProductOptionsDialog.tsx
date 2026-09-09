import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { effectivePrice, ProductWithVariations } from "@/types/menu";
import { useCart } from "@/contexts/CartContext";

interface ProductOptionsDialogProps {
  product: ProductWithVariations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProductOptionsDialog = ({ product, open, onOpenChange }: ProductOptionsDialogProps) => {
  const { addItem } = useCart();
  const [variationId, setVariationId] = useState<string | null>(null);
  const [addonQuantities, setAddonQuantities] = useState<Record<string, number>>({});
  const [quantity, setQuantity] = useState(1);

  const variations = (product?.product_variations ?? [])
    .filter((v) => v.active)
    .sort((a, b) => a.sort_order - b.sort_order);
  const addonLinks = (product?.product_addons ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);

  useEffect(() => {
    if (!open) return;
    setVariationId(variations[0]?.id ?? null);
    setAddonQuantities({});
    setQuantity(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product?.id]);

  if (!product) return null;

  const activeVariation = variations.find((v) => v.id === variationId) ?? null;
  const basePrice = activeVariation ? activeVariation.price : effectivePrice(product);
  const addonsUnitCost = addonLinks.reduce(
    (sum, link) => sum + link.addons.price * (addonQuantities[link.addons.id] ?? 0),
    0
  );
  const unitPrice = basePrice + addonsUnitCost;
  const total = unitPrice * quantity;

  const setAddonQty = (addonId: string, qty: number, max: number) => {
    setAddonQuantities((prev) => ({ ...prev, [addonId]: Math.max(0, Math.min(max, qty)) }));
  };

  const handleAdd = () => {
    const addons = addonLinks
      .map((link) => ({
        addonId: link.addons.id,
        name: link.addons.name,
        unitPrice: link.addons.price,
        quantity: addonQuantities[link.addons.id] ?? 0,
      }))
      .filter((a) => a.quantity > 0);

    addItem(
      {
        productId: product.id,
        productName: product.name,
        imageUrl: product.image_url,
        unitPrice,
        variationId: activeVariation?.id ?? null,
        variationName: activeVariation?.name ?? null,
        addons,
      },
      quantity
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wide">{product.name}</DialogTitle>
        </DialogHeader>

        {variations.length > 0 && (
          <div className="space-y-2">
            {variations.map((variation) => (
              <button
                key={variation.id}
                onClick={() => setVariationId(variation.id)}
                className={`w-full flex items-center justify-between p-3 rounded-md border text-left transition-colors ${
                  activeVariation?.id === variation.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <span className="font-medium">{variation.name}</span>
                <span className="font-semibold text-primary">{formatCurrency(variation.price)}</span>
              </button>
            ))}
          </div>
        )}

        {addonLinks.length > 0 && (
          <div className={variations.length > 0 ? "pt-4 border-t border-border space-y-3" : "space-y-3"}>
            <div>
              <p className="font-semibold">Adicionais</p>
              <p className="text-sm text-muted-foreground">Personalize seu pedido</p>
            </div>
            {addonLinks.map((link) => {
              const qty = addonQuantities[link.addons.id] ?? 0;
              return (
                <div key={link.addons.id} className="flex items-center justify-between gap-3 py-1">
                  <div className="min-w-0">
                    <p className="font-medium leading-tight">{link.addons.name}</p>
                    <p className="text-sm text-muted-foreground">
                      + {formatCurrency(link.addons.price)} · Máx {link.max_quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setAddonQty(link.addons.id, qty - 1, link.max_quantity)}
                      disabled={qty === 0}
                      aria-label={`Diminuir ${link.addons.name}`}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center font-semibold">{qty}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setAddonQty(link.addons.id, qty + 1, link.max_quantity)}
                      disabled={qty >= link.max_quantity}
                      aria-label={`Aumentar ${link.addons.name}`}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-center gap-4 py-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Diminuir quantidade"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="text-xl font-bold w-8 text-center">{quantity}</span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setQuantity((q) => q + 1)}
            aria-label="Aumentar quantidade"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <DialogFooter>
          <Button className="w-full font-display tracking-wide" size="lg" onClick={handleAdd}>
            Adicionar {formatCurrency(total)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
