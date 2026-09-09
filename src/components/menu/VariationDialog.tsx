import { useState } from "react";
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
import { Product, ProductVariation } from "@/types/menu";
import { useCart } from "@/contexts/CartContext";

interface VariationDialogProps {
  product: (Product & { product_variations: ProductVariation[] }) | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const VariationDialog = ({ product, open, onOpenChange }: VariationDialogProps) => {
  const { addItem } = useCart();
  const [selected, setSelected] = useState<ProductVariation | null>(null);
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const variations = product.product_variations
    .filter((v) => v.active)
    .sort((a, b) => a.sort_order - b.sort_order);
  const activeVariation = selected ?? variations[0] ?? null;

  const handleAdd = () => {
    if (!activeVariation) return;
    addItem(
      {
        productId: product.id,
        productName: product.name,
        imageUrl: product.image_url,
        unitPrice: activeVariation.price,
        variationId: activeVariation.id,
        variationName: activeVariation.name,
      },
      quantity
    );
    setQuantity(1);
    setSelected(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display tracking-wide">{product.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {variations.map((variation) => (
            <button
              key={variation.id}
              onClick={() => setSelected(variation)}
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
            Adicionar {activeVariation ? formatCurrency(activeVariation.price * quantity) : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
