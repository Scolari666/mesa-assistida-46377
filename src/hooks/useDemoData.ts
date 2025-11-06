import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const demoMenuItems = [
  // Entradas
  { name: "Bruschetta Caprese", price: 28.00, category: "Entradas", description: "Pão italiano, tomate, mussarela de búfala e manjericão", is_featured: false },
  { name: "Carpaccio de Salmão", price: 42.00, category: "Entradas", description: "Salmão fresco, alcaparras, limão siciliano e azeite", is_featured: false },
  { name: "Tábua de Queijos", price: 38.00, category: "Entradas", description: "Seleção de queijos artesanais com geleia", is_featured: false },
  // Principais
  { name: "Risoto de Camarão", price: 78.00, category: "Principais", description: "Arroz arbóreo, camarões grandes, alho-poró e parmesão", is_featured: true },
  { name: "Filé ao Molho Madeira", price: 89.00, category: "Principais", description: "Filé mignon grelhado, molho madeira e batatas rústicas", is_featured: false },
  { name: "Salmão Grelhado", price: 72.00, category: "Principais", description: "Salmão fresco, purê de batata-doce e legumes", is_featured: false },
  { name: "Massa à Carbonara", price: 56.00, category: "Principais", description: "Massa fresca, bacon, ovos, parmesão e pimenta", is_featured: false },
  // Bebidas
  { name: "Limonada Suíça", price: 18.00, category: "Bebidas", description: "Limão, açúcar, leite condensado e gelo", is_featured: false },
  { name: "Suco Natural", price: 14.00, category: "Bebidas", description: "Laranja, morango ou abacaxi", is_featured: false },
  { name: "Refrigerante", price: 8.00, category: "Bebidas", description: "Lata 350ml", is_featured: false },
  { name: "Água Mineral", price: 6.00, category: "Bebidas", description: "Com ou sem gás 500ml", is_featured: false },
  // Sobremesas
  { name: "Petit Gâteau", price: 32.00, category: "Sobremesas", description: "Bolo de chocolate com sorvete de creme", is_featured: true },
  { name: "Cheesecake", price: 28.00, category: "Sobremesas", description: "Tradicional com calda de frutas vermelhas", is_featured: false },
  { name: "Tiramisù", price: 30.00, category: "Sobremesas", description: "Sobremesa italiana clássica com café", is_featured: false },
];

export const useDemoData = () => {
  const { user } = useAuth();

  useEffect(() => {
    const initializeDemoData = async () => {
      if (!user) return;

      try {
        // Check if user already has menu items
        const { data: existingItems, error: checkError } = await supabase
          .from("menu_items")
          .select("id")
          .eq("user_id", user.id)
          .limit(1);

        if (checkError) throw checkError;

        // If user already has items, don't initialize demo data
        if (existingItems && existingItems.length > 0) return;

        // Check if user is on demo plan
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("subscription_plan")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;

        // Only initialize demo data for demo plan users
        if (profile?.subscription_plan !== "demo") return;

        // Create demo menu items
        const menuItemsToInsert = demoMenuItems.map(item => ({
          ...item,
          user_id: user.id,
          is_available: true,
        }));

        const { error: menuError } = await supabase
          .from("menu_items")
          .insert(menuItemsToInsert);

        if (menuError) throw menuError;

        // Create demo tables (Mesa 01 to Mesa 10)
        const demoTables = Array.from({ length: 10 }, (_, i) => ({
          user_id: user.id,
          table_number: `${String(i + 1).padStart(2, '0')}`,
          is_active: true,
          qr_code_data: `${window.location.origin}/menu/${user.id}/table-${String(i + 1).padStart(2, '0')}`,
        }));

        const { error: tablesError } = await supabase
          .from("tables")
          .insert(demoTables);

        if (tablesError) throw tablesError;

        toast.success("Dados de demonstração criados!", {
          description: "Explore o cardápio e as mesas de exemplo.",
        });
      } catch (error: any) {
        console.error("Error initializing demo data:", error);
      }
    };

    initializeDemoData();
  }, [user]);
};
