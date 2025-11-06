import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { Helmet } from "react-helmet";

const plans = [
  {
    name: "Básico",
    price: "79",
    description: "Ideal para começar",
    features: [
      "Até 20 mesas",
      "Cardápio digital ilimitado",
      "Função Chamar Atendente",
      "QR Codes personalizados",
      "Suporte por email",
      "Atualizações gratuitas",
    ],
    cta: "Começar Teste Grátis",
    highlighted: false,
  },
  {
    name: "Profissional",
    price: "149",
    description: "Mais popular",
    features: [
      "Até 50 mesas",
      "Tudo do plano Básico",
      "Relatórios avançados",
      "Dashboard em tempo real",
      "Suporte prioritário",
      "Integração com PDV",
      "Cardápios multilíngue",
    ],
    cta: "Começar Teste Grátis",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "299",
    description: "Para grandes operações",
    features: [
      "Mesas ilimitadas",
      "Tudo do plano Profissional",
      "API personalizada",
      "App para garçons",
      "Gerente de conta dedicado",
      "Treinamento presencial",
      "Personalização completa",
    ],
    cta: "Falar com Vendas",
    highlighted: false,
  },
];

const Pricing = () => {
  return (
    <>
      <Helmet>
        <title>Preços - MenuFacil Pro</title>
        <meta 
          name="description" 
          content="Planos e preços do MenuFacil Pro. Escolha o plano ideal para seu restaurante. 30 dias de teste grátis em todos os planos." 
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-subtle">
        <Navbar />
        
        <main className="container px-4 md:px-6 py-16">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Planos para todos os tamanhos
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
              Escolha o plano ideal para o seu restaurante. Todos incluem 30 dias de teste grátis.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
              <Check className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium">Sem contrato de fidelidade • Cancele quando quiser</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card
                key={index}
                className={`p-8 relative ${
                  plan.highlighted
                    ? "border-2 border-primary shadow-elegant scale-105 bg-gradient-card"
                    : "bg-card hover:shadow-card"
                } transition-all duration-300`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-hero text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                      Mais Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold">R$ {plan.price}</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="h-3 w-3 text-accent" />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={plan.highlighted ? "default" : "outline"}
                  size="lg"
                >
                  {plan.cta}
                </Button>
              </Card>
            ))}
          </div>

          {/* FAQ */}
          <div className="mt-24 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Perguntas Frequentes</h2>
            <div className="space-y-6">
              <Card className="p-6 bg-gradient-card">
                <h3 className="font-semibold mb-2">Como funciona o teste grátis?</h3>
                <p className="text-sm text-muted-foreground">
                  Você tem 30 dias completos para testar todas as funcionalidades do plano escolhido. 
                  Não pedimos cartão de crédito para começar.
                </p>
              </Card>
              <Card className="p-6 bg-gradient-card">
                <h3 className="font-semibold mb-2">Posso mudar de plano depois?</h3>
                <p className="text-sm text-muted-foreground">
                  Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. 
                  O ajuste é proporcional e refletido na próxima cobrança.
                </p>
              </Card>
              <Card className="p-6 bg-gradient-card">
                <h3 className="font-semibold mb-2">Como funciona a cobrança?</h3>
                <p className="text-sm text-muted-foreground">
                  A cobrança é mensal e recorrente. Você recebe um email 7 dias antes da renovação. 
                  Aceitamos cartão de crédito, PIX e boleto.
                </p>
              </Card>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Pricing;
