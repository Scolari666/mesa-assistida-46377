import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, ChevronLeft, Loader2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Helmet } from "react-helmet";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  is_featured: boolean;
  is_available: boolean;
}

const MenuDemo = () => {
  const { userId } = useParams<{ userId?: string }>();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [callRequested, setCallRequested] = useState(false);
  const [loading, setLoading] = useState(true);
  const [restaurantName, setRestaurantName] = useState("Restaurante");

  useEffect(() => {
    fetchMenuData();
  }, [userId]);

  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0]);
    }
  }, [categories]);

  const fetchMenuData = async () => {
    try {
      setLoading(true);

      // Fetch menu items - either for specific user or all available items
      let query = supabase
        .from("menu_items")
        .select("*")
        .eq("is_available", true)
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (userId) {
        query = query.eq("user_id", userId);
        
        // Fetch restaurant name if userId is provided
        const { data: profile } = await supabase
          .from("profiles")
          .select("restaurant_name")
          .eq("id", userId)
          .single();

        if (profile) {
          setRestaurantName(profile.restaurant_name);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      setMenuItems(data || []);

      // Extract unique categories
      const uniqueCategories = [
        ...new Set(data?.map((item) => item.category) || []),
      ];
      setCategories(uniqueCategories);
    } catch (error: any) {
      console.error("Error fetching menu:", error);
      toast.error("Erro ao carregar cardápio");
    } finally {
      setLoading(false);
    }
  };

  const handleCallWaiter = () => {
    setCallRequested(true);
    toast.success("Atendente chamado com sucesso!", {
      description: "Um membro da nossa equipe estará com você em instantes.",
    });

    setTimeout(() => {
      setCallRequested(false);
    }, 5000);
  };

  const filteredItems = menuItems.filter(
    (item) => item.category === selectedCategory
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (menuItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <h2 className="text-2xl font-bold mb-2">Cardápio Indisponível</h2>
        <p className="text-muted-foreground mb-6 text-center">
          Este restaurante ainda não cadastrou itens no cardápio.
        </p>
        <Button asChild>
          <Link to="/">Voltar para Início</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{restaurantName} - Cardápio Digital</title>
        <meta
          name="description"
          content={`Veja o cardápio digital do ${restaurantName}. Navegue pelo menu e chame o atendente quando precisar.`}
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border/50">
          <div className="container px-4 py-3 flex items-center justify-between">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Voltar
              </Link>
            </Button>
            <div className="text-center">
              <h1 className="font-bold">{restaurantName}</h1>
              <p className="text-xs text-muted-foreground">Cardápio Digital</p>
            </div>
            <div className="w-20" /> {/* Spacer for centering */}
          </div>
        </header>

        {/* Call Waiter Button - Fixed */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <Button
            size="lg"
            className={`text-lg shadow-glow transition-all duration-300 ${
              callRequested ? "bg-accent hover:bg-accent" : ""
            }`}
            onClick={handleCallWaiter}
            disabled={callRequested}
          >
            {callRequested ? (
              <>
                <Check className="mr-2 h-5 w-5" />
                Atendente Chamado
              </>
            ) : (
              <>
                <Bell className="mr-2 h-5 w-5 animate-pulse" />
                Chamar Atendente
              </>
            )}
          </Button>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="sticky top-[57px] z-40 bg-background/95 backdrop-blur-lg border-b border-border/50">
            <div className="container px-4 py-4 overflow-x-auto">
              <div className="flex gap-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={
                      selectedCategory === category ? "default" : "outline"
                    }
                    onClick={() => setSelectedCategory(category)}
                    className="whitespace-nowrap"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Menu Items */}
        <main className="container px-4 py-6 pb-32">
          <div className="space-y-4">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum item disponível nesta categoria
              </div>
            ) : (
              filteredItems.map((item) => (
                <Card
                  key={item.id}
                  className="overflow-hidden hover:shadow-card transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="flex gap-4">
                    {item.image_url && (
                      <div className="w-24 h-24 flex-shrink-0">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 p-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">
                              {item.name}
                            </h3>
                            {item.is_featured && (
                              <Badge className="bg-primary/10 text-primary border-primary/20">
                                Destaque
                              </Badge>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-lg text-primary">
                            R$ {item.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default MenuDemo;
