import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import foodImage from "@/assets/food-dishes.jpg";

export const CTA = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-hero opacity-5" />
      
      <div className="container px-4 md:px-6 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Pronto para transformar seu restaurante?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Junte-se a mais de 500 restaurantes que já melhoraram a experiência dos seus clientes
              e aumentaram a eficiência do atendimento.
            </p>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ArrowRight className="h-4 w-4 text-accent-foreground" />
                </div>
                <span className="text-lg">30 dias de teste grátis - sem cartão de crédito</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ArrowRight className="h-4 w-4 text-accent-foreground" />
                </div>
                <span className="text-lg">Configuração guiada em menos de 10 minutos</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ArrowRight className="h-4 w-4 text-accent-foreground" />
                </div>
                <span className="text-lg">Suporte em português todos os dias</span>
              </li>
            </ul>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="text-lg shadow-elegant hover:shadow-glow transition-all duration-300" asChild>
                <Link to="/pricing">
                  Começar Agora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg border-2" asChild>
                <Link to="/menu-demo">Ver Demo</Link>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-hero opacity-20 blur-2xl rounded-3xl" />
            <img
              src={foodImage}
              alt="Pratos deliciosos"
              className="relative rounded-3xl shadow-elegant w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
