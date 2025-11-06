import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, TrendingUp, Users, Clock, Eye } from "lucide-react";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDemoData } from "@/hooks/useDemoData";
import { toast } from "sonner";

interface Call {
  id: string;
  table_id: string;
  status: string;
  created_at: string;
  tables: {
    table_number: string;
  };
}

const Dashboard = () => {
  const { user } = useAuth();
  useDemoData(); // Initialize demo data if needed

  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCalls: 0,
    avgResponseTime: "1:30min",
    activeTables: 0,
    totalTables: 0,
    views: 0,
  });

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        // Fetch active calls
        const { data: callsData, error: callsError } = await supabase
          .from("calls")
          .select(`
            id,
            table_id,
            status,
            created_at,
            tables (
              table_number
            )
          `)
          .eq("user_id", user.id)
          .eq("status", "pending")
          .order("created_at", { ascending: false });

        if (callsError) throw callsError;
        setCalls(callsData || []);

        // Fetch tables count
        const { data: tablesData, error: tablesError } = await supabase
          .from("tables")
          .select("id, is_active")
          .eq("user_id", user.id);

        if (tablesError) throw tablesError;

        const activeTables = tablesData?.filter(t => t.is_active).length || 0;
        const totalTables = tablesData?.length || 0;

        // Fetch total calls today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { data: todayCallsData, error: todayCallsError } = await supabase
          .from("calls")
          .select("id")
          .eq("user_id", user.id)
          .gte("created_at", today.toISOString());

        if (todayCallsError) throw todayCallsError;

        setStats({
          totalCalls: todayCallsData?.length || 0,
          avgResponseTime: "1:30min",
          activeTables,
          totalTables,
          views: Math.floor(Math.random() * 200) + 50, // Demo data
        });
      } catch (error: any) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Erro ao carregar dados do dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Subscribe to realtime calls
    const channel = supabase
      .channel("calls-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "calls",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleAttend = async (callId: string) => {
    try {
      const { error } = await supabase
        .from("calls")
        .update({ 
          status: "attended",
          attended_at: new Date().toISOString()
        })
        .eq("id", callId);

      if (error) throw error;

      toast.success("Chamado atendido!");
      
      // Remove from list after animation
      setTimeout(() => {
        setCalls(calls.filter(call => call.id !== callId));
      }, 1000);
    } catch (error: any) {
      console.error("Error attending call:", error);
      toast.error("Erro ao atender chamado");
    }
  };

  const getTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return "Agora";
    if (minutes === 1) return "Há 1 min";
    return `Há ${minutes} min`;
  };

  const dashboardStats = [
    { icon: Bell, label: "Chamados Hoje", value: stats.totalCalls.toString(), trend: "+12%", color: "text-primary" },
    { icon: Clock, label: "Tempo Médio", value: stats.avgResponseTime, trend: "-23%", color: "text-accent" },
    { icon: Users, label: "Mesas Ativas", value: `${stats.activeTables}/${stats.totalTables}`, trend: `${Math.round((stats.activeTables/stats.totalTables)*100)}%`, color: "text-blue-500" },
    { icon: Eye, label: "Visualizações", value: stats.views.toString(), trend: "+8%", color: "text-purple-500" },
  ];

  return (
    <>
      <Helmet>
        <title>Dashboard - MenuFacil Pro</title>
        <meta 
          name="description" 
          content="Painel administrativo do MenuFacil Pro. Gerencie chamados, monitore métricas e controle seu restaurante em tempo real." 
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-subtle">
        <Navbar />
        
        <main className="container px-4 md:px-6 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Painel de controle em tempo real do seu restaurante</p>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {dashboardStats.map((stat, index) => (
              <Card key={index} className="p-6 bg-gradient-card hover:shadow-card transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-muted ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {stat.trend}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* Active Calls */}
          <Card className="p-6 bg-gradient-card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Chamados Ativos</h2>
                <p className="text-sm text-muted-foreground">Mesas solicitando atendimento</p>
              </div>
              {calls.filter(c => c.status === "pending").length > 0 && (
                <Badge className="bg-primary text-primary-foreground animate-pulse">
                  {calls.filter(c => c.status === "pending").length} pendente(s)
                </Badge>
              )}
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Carregando chamados...</p>
                </div>
              ) : calls.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <Check className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">Nenhum chamado ativo no momento</p>
                </div>
              ) : (
                calls.map((call) => (
                  <Card
                    key={call.id}
                    className="p-6 border-2 border-primary shadow-glow animate-pulse transition-all duration-300"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold bg-gradient-hero text-primary-foreground">
                          {call.tables?.table_number || "--"}
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold">Mesa {call.tables?.table_number || "--"}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {getTimeAgo(call.created_at)}
                          </p>
                        </div>
                      </div>

                      <Button
                        size="lg"
                        onClick={() => handleAttend(call.id)}
                        className="min-w-[140px]"
                      >
                        <Bell className="mr-2 h-5 w-5" />
                        Atender
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </Card>

          {/* Demo/Trial Notice */}
          <Card className="mt-6 p-4 bg-secondary/50 border-primary/20">
            <p className="text-sm text-center">
              ✨ <strong>Teste Grátis:</strong> Você está no período de avaliação de 30 dias com acesso completo a todas as funcionalidades.
            </p>
          </Card>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Dashboard;
