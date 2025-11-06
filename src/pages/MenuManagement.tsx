import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { MenuItemDialog } from "@/components/menu/MenuItemDialog";
import { MenuItemCard } from "@/components/menu/MenuItemCard";
import { CategoryFilter } from "@/components/menu/CategoryFilter";

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  is_featured: boolean;
  is_available: boolean;
  user_id: string;
}

const CATEGORIES = ["Entradas", "Principais", "Bebidas", "Sobremesas"];

export default function MenuManagement() {
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMenuItems();
    }
  }, [user]);

  useEffect(() => {
    filterItems();
  }, [menuItems, searchQuery, selectedCategory]);

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("user_id", user?.id)
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar itens do cardápio");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = [...menuItems];

    if (selectedCategory) {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredItems(filtered);
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string, imageUrl: string | null) => {
    if (!confirm("Tem certeza que deseja excluir este item?")) return;

    try {
      // Delete image from storage if exists
      if (imageUrl) {
        const imagePath = imageUrl.split("/").pop();
        if (imagePath) {
          await supabase.storage.from("menu-images").remove([imagePath]);
        }
      }

      const { error } = await supabase.from("menu_items").delete().eq("id", id);

      if (error) throw error;

      setMenuItems((prev) => prev.filter((item) => item.id !== id));
      toast.success("Item excluído com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao excluir item");
      console.error(error);
    }
  };

  const handleToggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("menu_items")
        .update({ is_available: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      setMenuItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, is_available: !currentStatus } : item
        )
      );
      toast.success("Disponibilidade atualizada!");
    } catch (error: any) {
      toast.error("Erro ao atualizar disponibilidade");
      console.error(error);
    }
  };

  const handleSave = () => {
    fetchMenuItems();
    setIsDialogOpen(false);
    setEditingItem(null);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" className="w-fit" asChild>
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Início
          </Link>
        </Button>
        
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestão do Cardápio</h1>
            <p className="text-muted-foreground">
              Adicione, edite e organize os itens do seu cardápio
            </p>
          </div>
          <Button onClick={handleAddNew} size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Adicionar Item
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou descrição..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <CategoryFilter
          categories={CATEGORIES}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>

      {/* Menu Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchQuery || selectedCategory
              ? "Nenhum item encontrado com os filtros aplicados"
              : "Nenhum item no cardápio. Adicione o primeiro item!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleAvailability={handleToggleAvailability}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <MenuItemDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingItem={editingItem}
        onSave={handleSave}
        categories={CATEGORIES}
      />
    </div>
  );
}
