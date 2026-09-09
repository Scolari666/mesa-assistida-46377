import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Category, Product, ProductVariation, Addon } from "@/types/menu";
import { formatCurrency } from "@/lib/format";

interface VariationDraft {
  id?: string;
  name: string;
  price: string;
}

interface AddonLinkDraft {
  addonId: string;
  maxQuantity: string;
}

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  categories: Category[];
  allProducts: Product[];
  allAddons: Addon[];
  onSaved: () => void;
}

export const ProductDialog = ({
  open,
  onOpenChange,
  product,
  categories,
  allProducts,
  allAddons,
  onSaved,
}: ProductDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [price, setPrice] = useState("");
  const [promoPrice, setPromoPrice] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isCombo, setIsCombo] = useState(false);
  const [active, setActive] = useState(true);
  const [variations, setVariations] = useState<VariationDraft[]>([]);
  const [suggestionIds, setSuggestionIds] = useState<string[]>([]);
  const [comboItemIds, setComboItemIds] = useState<string[]>([]);
  const [addonLinks, setAddonLinks] = useState<AddonLinkDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) return;

    setName(product?.name ?? "");
    setDescription(product?.description ?? "");
    setCategoryId(product?.category_id ?? categories[0]?.id ?? "");
    setPrice(product ? String(product.price) : "");
    setPromoPrice(product?.promo_price != null ? String(product.promo_price) : "");
    setImageUrl(product?.image_url ?? null);
    setIsCombo(product?.is_combo ?? false);
    setActive(product?.active ?? true);

    if (!product) {
      setVariations([]);
      setSuggestionIds([]);
      setComboItemIds([]);
      setAddonLinks([]);
      return;
    }

    supabase
      .from("product_variations")
      .select("*")
      .eq("product_id", product.id)
      .order("sort_order")
      .then(({ data }) =>
        setVariations(
          (data ?? []).map((v: ProductVariation) => ({ id: v.id, name: v.name, price: String(v.price) }))
        )
      );

    supabase
      .from("product_suggestions")
      .select("suggested_product_id")
      .eq("product_id", product.id)
      .then(({ data }) => setSuggestionIds((data ?? []).map((r) => r.suggested_product_id)));

    supabase
      .from("combo_items")
      .select("item_product_id")
      .eq("combo_id", product.id)
      .then(({ data }) => setComboItemIds((data ?? []).map((r) => r.item_product_id)));

    supabase
      .from("product_addons")
      .select("addon_id, max_quantity")
      .eq("product_id", product.id)
      .then(({ data }) =>
        setAddonLinks((data ?? []).map((r) => ({ addonId: r.addon_id, maxQuantity: String(r.max_quantity) })))
      );
  }, [open, product, categories]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    const path = `products/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const { error } = await supabase.storage.from("porks-images").upload(path, file, { upsert: true });
    setUploading(false);

    if (error) {
      toast.error("Não foi possível enviar a imagem.");
      return;
    }
    const { data } = supabase.storage.from("porks-images").getPublicUrl(path);
    setImageUrl(data.publicUrl);
    toast.success("Imagem enviada!");
  };

  const handleSave = async () => {
    if (!name.trim() || !price) {
      toast.error("Informe ao menos nome e preço.");
      return;
    }
    setSaving(true);

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      category_id: categoryId || null,
      price: Number(price),
      promo_price: promoPrice ? Number(promoPrice) : null,
      image_url: imageUrl,
      is_combo: isCombo,
      active,
    };

    let productId = product?.id;

    if (product) {
      const { error } = await supabase.from("products").update(payload).eq("id", product.id);
      if (error) {
        setSaving(false);
        toast.error("Erro ao salvar produto.");
        return;
      }
    } else {
      const { data, error } = await supabase.from("products").insert(payload).select("id").single();
      if (error || !data) {
        setSaving(false);
        toast.error("Erro ao criar produto.");
        return;
      }
      productId = data.id;
    }

    if (!productId) {
      setSaving(false);
      return;
    }

    // Update existing variations in place instead of recreating them, so the
    // variation_id kept on past order_items keeps pointing at a real row.
    const validVariations = variations.filter((v) => v.name.trim() && v.price);
    const keptIds = validVariations.map((v) => v.id).filter(Boolean) as string[];

    let removeQuery = supabase.from("product_variations").delete().eq("product_id", productId);
    if (keptIds.length) removeQuery = removeQuery.not("id", "in", `(${keptIds.join(",")})`);
    await removeQuery;

    await Promise.all(
      validVariations.map((variation, index) => {
        const row = {
          product_id: productId,
          name: variation.name.trim(),
          price: Number(variation.price),
          sort_order: index,
        };
        return variation.id
          ? supabase.from("product_variations").update(row).eq("id", variation.id)
          : supabase.from("product_variations").insert(row);
      })
    );

    await supabase.from("product_suggestions").delete().eq("product_id", productId);
    if (suggestionIds.length) {
      await supabase.from("product_suggestions").insert(
        suggestionIds.map((id, index) => ({
          product_id: productId,
          suggested_product_id: id,
          sort_order: index,
        }))
      );
    }

    await supabase.from("combo_items").delete().eq("combo_id", productId);
    if (isCombo && comboItemIds.length) {
      await supabase.from("combo_items").insert(
        comboItemIds.map((id) => ({ combo_id: productId, item_product_id: id, quantity: 1 }))
      );
    }

    const validAddonLinks = addonLinks.filter((link) => Number(link.maxQuantity) > 0);
    await supabase.from("product_addons").delete().eq("product_id", productId);
    if (validAddonLinks.length) {
      await supabase.from("product_addons").insert(
        validAddonLinks.map((link, index) => ({
          product_id: productId,
          addon_id: link.addonId,
          max_quantity: Number(link.maxQuantity),
          sort_order: index,
        }))
      );
    }

    setSaving(false);
    toast.success(product ? "Produto atualizado!" : "Produto criado!");
    onSaved();
    onOpenChange(false);
  };

  const toggleId = (list: string[], setList: (next: string[]) => void, id: string) => {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  const toggleAddonLink = (addonId: string) => {
    setAddonLinks((links) =>
      links.some((l) => l.addonId === addonId)
        ? links.filter((l) => l.addonId !== addonId)
        : [...links, { addonId, maxQuantity: "4" }]
    );
  };

  const otherProducts = allProducts.filter((p) => p.id !== product?.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wide">
            {product ? "Editar produto" : "Novo produto"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="p-name">Nome</Label>
              <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="p-category">Categoria</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="p-category" className="mt-1.5">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="p-desc">Descrição</Label>
            <Textarea
              id="p-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1.5"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="p-price">Preço (R$)</Label>
              <Input
                id="p-price"
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="p-promo">Preço promocional (opcional)</Label>
              <Input
                id="p-promo"
                type="number"
                step="0.01"
                value={promoPrice}
                onChange={(e) => setPromoPrice(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label>Foto</Label>
            <div className="flex items-center gap-3 mt-1.5">
              <div className="h-16 w-16 rounded-md bg-muted overflow-hidden flex-shrink-0">
                {imageUrl ? (
                  <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-2xl">🐷</div>
                )}
              </div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file);
                  }}
                />
                <span className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border hover:border-primary text-sm">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Enviar imagem
                </span>
              </label>
              {imageUrl && (
                <Button variant="ghost" size="sm" onClick={() => setImageUrl(null)}>
                  Remover
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Switch id="p-active" checked={active} onCheckedChange={setActive} />
              <Label htmlFor="p-active">Ativo no cardápio</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="p-combo" checked={isCombo} onCheckedChange={setIsCombo} />
              <Label htmlFor="p-combo">É um combo</Label>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-2">
              <Label>Variações (tamanho/porção)</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVariations([...variations, { name: "", price: "" }])}
              >
                <Plus className="h-3 w-3 mr-1" /> Adicionar
              </Button>
            </div>
            {variations.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Sem variações — o produto usa o preço base.
              </p>
            )}
            <div className="space-y-2">
              {variations.map((variation, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Ex.: Copo 300ml"
                    value={variation.name}
                    onChange={(e) => {
                      const next = [...variations];
                      next[index] = { ...variation, name: e.target.value };
                      setVariations(next);
                    }}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Preço"
                    className="w-32"
                    value={variation.price}
                    onChange={(e) => {
                      const next = [...variations];
                      next[index] = { ...variation, price: e.target.value };
                      setVariations(next);
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setVariations(variations.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {isCombo && (
            <div className="border-t border-border pt-4">
              <Label>Itens inclusos no combo</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {otherProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => toggleId(comboItemIds, setComboItemIds, p.id)}
                    className={`px-3 py-1.5 rounded-md border text-sm transition-colors ${
                      comboItemIds.includes(p.id)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-border pt-4">
            <Label>Sugestões "Peça também"</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {otherProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => toggleId(suggestionIds, setSuggestionIds, p.id)}
                  className={`px-3 py-1.5 rounded-md border text-sm transition-colors ${
                    suggestionIds.includes(p.id)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {p.name} · {formatCurrency(Number(p.promo_price ?? p.price))}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <Label>Adicionais disponíveis</Label>
            {allAddons.length === 0 ? (
              <p className="text-sm text-muted-foreground mt-2">
                Nenhum adicional cadastrado ainda. Crie na aba "Adicionais".
              </p>
            ) : (
              <div className="space-y-2 mt-2">
                {allAddons.map((addon) => {
                  const link = addonLinks.find((l) => l.addonId === addon.id);
                  return (
                    <div key={addon.id} className="flex items-center gap-3">
                      <button
                        onClick={() => toggleAddonLink(addon.id)}
                        className={`flex-1 text-left px-3 py-1.5 rounded-md border text-sm transition-colors ${
                          link
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {addon.name} · {formatCurrency(Number(addon.price))}
                      </button>
                      {link && (
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground whitespace-nowrap">Máx</Label>
                          <Input
                            type="number"
                            min="1"
                            className="w-16"
                            value={link.maxQuantity}
                            onChange={(e) =>
                              setAddonLinks((links) =>
                                links.map((l) =>
                                  l.addonId === addon.id ? { ...l, maxQuantity: e.target.value } : l
                                )
                              )
                            }
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="font-display tracking-wide">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
