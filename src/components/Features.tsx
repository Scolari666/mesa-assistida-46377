import { QrCode, Bell, Sparkles, TrendingUp, Shield, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: QrCode,
    title: "QR Code Inteligente",
    description: "Cada mesa tem seu próprio QR Code. Cliente escaneia e acessa o cardápio instantaneamente.",
  },
  {
    icon: Bell,
    title: "Chamar Atendente",
    description: "Botão de destaque que notifica a equipe em tempo real. Sem mais espera frustante.",
  },
  {
    icon: Sparkles,
    title: "Cardápio Sempre Atualizado",
    description: "Atualize preços, pratos e promoções em segundos. Sem custo de reimpressão.",
  },
  {
    icon: TrendingUp,
    title: "Dashboard Completo",
    description: "Acompanhe métricas em tempo real: pratos mais vistos, horários de pico, tempo de resposta.",
  },
  {
    icon: Shield,
    title: "Seguro e Higiênico",
    description: "Sem contato com cardápios físicos. Cada cliente usa seu próprio smartphone.",
  },
  {
    icon: Zap,
    title: "Setup em Minutos",
    description: "Configure seu restaurante, adicione o cardápio e gere os QR Codes. Tudo em menos de 10 minutos.",
  },
];

export const Features = () => {
  return (
    <section className="py-24 bg-gradient-subtle">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Tudo que seu restaurante precisa
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Funcionalidades pensadas para aumentar a eficiência e melhorar a experiência do cliente
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="p-6 bg-gradient-card border-2 hover:shadow-card transition-all duration-300 hover:-translate-y-1"
            >
              <div className="mb-4 inline-flex p-3 rounded-xl bg-primary/10">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
