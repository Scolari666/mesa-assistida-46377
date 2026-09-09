import { useCallback, useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ProductDialog } from "@/components/admin/ProductDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, ArrowUp, ArrowDown, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";
import { Category, Product } from "@/types/menu";

const AdminMenu = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string } | null>(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<
    { type: "category" | "product"; id: string; name: string } | null
  >(null);

  const fetchAll = useCallback(async () => {
    const [{ data: cats }, { data: prods }] = await Promise.all([
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("products").select("*").order("sort_order"),
    ]);
    setCategories(cats ?? []);
    setProducts(prods ?? []);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addCategory = async () => {
    if (!newCategory.trim()) return;
    const { error } = await supabase
      .from("categories")
      .insert({ name: newCategory.trim(), sort_order: categories.length + 1 });
    if (error) {
      toast.error("Erro ao criar categoria.");
      return;
    }
    setNewCategory("");
    toast.success("Categoria criada!");
    fetchAll();
  };

  const renameCategory = async () => {
    if (!editingCategory) return;
    const { error } = await supabase
      .from("categories")
      .update({ name: editingCategory.name.trim() })
      .eq("id", editingCategory.id);
    if (error) {
      toast.error("Erro ao renomear categoria.");
      return;
    }
    setEditingCategory(null);
    fetchAll();
  };

  const moveCategory = async (category: Category, direction: -1 | 1) => {
    const ordered = [...categories];
    const index = ordered.findIndex((c) => c.id === category.id);
    const target = index + direction;
    if (target < 0 || target >= ordered.length) return;

    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    setCategories(ordered);

    await Promise.all(
      ordered.map((cat, position) =>
        supabase.from("categories").update({ sort_order: position + 1 }).eq("id", cat.id)
      )
    );
    fetchAll();
  };

  const toggleCategoryActive = async (category: Category) => {
    await supabase.from("categories").update({ active: !category.active }).eq("id", category.id);
    fetchAll();
  };

  const toggleProductActive = async (product: Product) => {
    await supabase.from("products").update({ active: !product.active }).eq("id", product.id);
    fetchAll();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const table = deleteTarget.type === "category" ? "categories" : "products";
    const { error } = await supabase.from(table).delete().eq("id", deleteTarget.id);
    if (error) {
      toast.error("Erro ao excluir.");
    } else {
      toast.success("Excluído com sucesso.");
      fetchAll();
    }
    setDeleteTarget(null);
  };

  const categoryName = (id: string | null) =>
    categories.find((c) => c.id === id)?.name ?? "Sem categoria";

  return (
    <AdminLayout>
      <Helmet>
        <title>Cardápio - Painel Porks</title>
      </Helmet>

      <h1 className="text-3xl mb-6">Cardápio</h1>

      <Tabs defaultValue="products">
        <TabsList className="mb-6">
          <TabsTrigger value="products">Produtos e combos</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">{products.length} item(ns) cadastrado(s)</p>
            <Button
              onClick={() => {
                setEditingProduct(null);
                setProductDialogOpen(true);
              }}
              className="font-display tracking-wide"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo produto
            </Button>
          </div>

          <div className="space-y-2">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-4 bg-card border border-border rounded-lg p-3"
              >
                <div className="h-14 w-14 rounded-md bg-muted overflow-hidden flex-shrink-0">
                  {product.image_url ? (
                    <img src={product.image_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xl">🐷</div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{product.name}</span>
                    {product.is_combo && <Badge className="bg-primary text-primary-foreground">Combo</Badge>}
                    {!product.active && <Badge variant="outline">Inativo</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {categoryName(product.category_id)} ·{" "}
                    {product.promo_price != null ? (
                      <>
                        <span className="line-through">{formatCurrency(Number(product.price))}</span>{" "}
                        <span className="text-primary">{formatCurrency(Number(product.promo_price))}</span>
                      </>
                    ) : (
                      formatCurrency(Number(product.price))
                    )}
                  </p>
                </div>

                <Switch checked={product.active} onCheckedChange={() => toggleProductActive(product)} />

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditingProduct(product);
                    setProductDialogOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteTarget({ type: "product", id: product.id, name: product.name })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <div className="flex gap-2 mb-6 max-w-md">
            <Input
              placeholder="Nova categoria"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCategory()}
            />
            <Button onClick={addCategory}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2 max-w-2xl">
            {categories.map((category, index) => (
              <div
                key={category.id}
                className="flex items-center gap-3 bg-card border border-border rounded-lg p-3"
              >
                <div className="flex flex-col">
                  <button
                    onClick={() => moveCategory(category, -1)}
                    disabled={index === 0}
                    className="disabled:opacity-30 hover:text-primary"
                    aria-label="Mover para cima"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => moveCategory(category, 1)}
                    disabled={index === categories.length - 1}
                    className="disabled:opacity-30 hover:text-primary"
                    aria-label="Mover para baixo"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>

                {editingCategory?.id === category.id ? (
                  <>
                    <Input
                      value={editingCategory.name}
                      onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                      onKeyDown={(e) => e.key === "Enter" && renameCategory()}
                      className="flex-1"
                    />
                    <Button variant="ghost" size="icon" onClick={renameCategory}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setEditingCategory(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 font-semibold">{category.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {products.filter((p) => p.category_id === category.id).length} itens
                    </span>
                    <Switch
                      checked={category.active}
                      onCheckedChange={() => toggleCategoryActive(category)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingCategory({ id: category.id, name: category.name })}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setDeleteTarget({ type: "category", id: category.id, name: category.name })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <ProductDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        product={editingProduct}
        categories={categories}
        allProducts={products}
        onSaved={fetchAll}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === "category"
                ? "Os produtos dessa categoria ficarão sem categoria."
                : "O produto sai do cardápio. Pedidos antigos mantêm o histórico."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminMenu;
