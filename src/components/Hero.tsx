import { Button } from "@/components/ui/button";
import { QrCode, Bell, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-restaurant.jpg";

export const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Restaurante moderno"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-background/50" />
      </div>

      {/* Content */}
      <div className="container relative z-10 px-4 md:px-6">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-secondary/80 backdrop-blur-sm border border-primary/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-sm font-medium">Novo: Integração com PDV</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Cardápio Digital que{" "}
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              Transforma
            </span>{" "}
            seu Atendimento
          </h1>

          <p className="text-xl md:text-2xl mb-8 text-muted-foreground max-w-2xl">
            Elimine filas de espera, reduza custos e ofereça uma experiência moderna aos seus clientes.
            QR Code + cardápio digital + botão para chamar atendente.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Button size="lg" className="text-lg shadow-elegant hover:shadow-glow transition-all duration-300" asChild>
              <Link to="/auth">
                <Smartphone className="mr-2 h-5 w-5" />
                Começar Teste Grátis
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg border-2" asChild>
              <Link to="/menu-demo">
                Ver Demo do Cardápio
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border/50">
            <div>
              <div className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">98%</div>
              <div className="text-sm text-muted-foreground">Satisfação</div>
            </div>
            <div>
              <div className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">-40%</div>
              <div className="text-sm text-muted-foreground">Tempo de Espera</div>
            </div>
            <div>
              <div className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">500+</div>
              <div className="text-sm text-muted-foreground">Restaurantes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Icons */}
      <div className="absolute bottom-20 right-20 hidden lg:flex flex-col gap-4 animate-pulse">
        <div className="p-4 rounded-2xl bg-card shadow-elegant backdrop-blur-sm">
          <QrCode className="h-8 w-8 text-primary" />
        </div>
        <div className="p-4 rounded-2xl bg-card shadow-elegant backdrop-blur-sm">
          <Bell className="h-8 w-8 text-accent" />
        </div>
      </div>
    </section>
  );
};
