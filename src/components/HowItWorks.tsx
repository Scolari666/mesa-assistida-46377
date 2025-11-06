import { Scan, Menu, Bell, Check } from "lucide-react";
import phoneImage from "@/assets/phone-menu.jpg";

const steps = [
  {
    icon: Scan,
    number: "01",
    title: "Cliente Escaneia o QR Code",
    description: "Cada mesa possui um QR Code exclusivo. O cliente aponta a câmera e pronto!",
  },
  {
    icon: Menu,
    number: "02",
    title: "Navega pelo Cardápio Digital",
    description: "Interface linda e intuitiva com fotos, descrições e preços sempre atualizados.",
  },
  {
    icon: Bell,
    number: "03",
    title: "Chama o Atendente",
    description: "Botão de destaque notifica sua equipe instantaneamente. Sem mais espera.",
  },
  {
    icon: Check,
    number: "04",
    title: "Atendimento Ágil",
    description: "Sua equipe recebe a notificação e sabe exatamente qual mesa precisa de atenção.",
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-24">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Como funciona?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Simples, rápido e eficiente. Veja como o MenuFacil Pro funciona na prática
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            {steps.map((step, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-hero flex items-center justify-center shadow-elegant">
                    <step.icon className="h-8 w-8 text-primary-foreground" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-primary mb-1">PASSO {step.number}</div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-hero opacity-20 blur-3xl rounded-full" />
            <img
              src={phoneImage}
              alt="MenuFacil Pro em smartphone"
              className="relative rounded-3xl shadow-elegant w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
