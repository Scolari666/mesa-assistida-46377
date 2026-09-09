import aboutStorefront from "@/assets/about-storefront.jpg";
import aboutChope from "@/assets/about-chope.jpg";
import aboutNeonRoom from "@/assets/about-neon-room.jpg";

export const AboutSection = () => {
  return (
    <section id="o-lugar" className="py-20 md:py-28 bg-background">
      <div className="container px-4 md:px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="font-hand text-primary text-2xl">Conheça</span>
            <h2 className="text-4xl md:text-5xl mb-6">O Lugar</h2>
            <p className="text-muted-foreground text-lg mb-4">
              Um bar de porco e chope no coração de Santa Maria. Ambiente urbano, música
              boa e aquele clima de boteco raiz — sem frescura, com fila pra costela.
            </p>
            <p className="text-muted-foreground text-lg mb-4">
              Mesas ao ar livre, chopeira sempre gelada e uma cozinha que não sai do fogo.
              Aqui o porco é rei e o chope nunca falta.
            </p>
            <p className="text-muted-foreground text-lg">
              Peça pelo cardápio online e receba tudo fresquinho, ou venha retirar direto
              no balcão sem taxa nenhuma.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <img
              src={aboutStorefront}
              alt="Fachada do Porks Santa Maria"
              className="rounded-lg col-span-2 h-56 w-full object-cover border border-border hover:scale-[1.02] transition-transform duration-300"
            />
            <img
              src={aboutChope}
              alt="Chope gelado do Porks"
              className="rounded-lg h-40 w-full object-cover border border-border hover:scale-[1.02] transition-transform duration-300"
            />
            <img
              src={aboutNeonRoom}
              alt="Ambiente decorado do Porks"
              className="rounded-lg h-40 w-full object-cover border border-border hover:scale-[1.02] transition-transform duration-300"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
