import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { AboutSection } from "@/components/AboutSection";
import { WeeklyAgenda } from "@/components/WeeklyAgenda";
import { FeaturedMenu } from "@/components/FeaturedMenu";
import { LocationHours } from "@/components/LocationHours";
import { Footer } from "@/components/Footer";
import { Helmet } from "react-helmet";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Porks Santa Maria - Porco &amp; Chope</title>
        <meta
          name="description"
          content="Peça online no Porks Santa Maria: pratos de porco, chopes gelados, petiscos, combos e drinks. Entrega ou retirada, com desconto no pagamento online."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />
        <main>
          <Hero />
          <AboutSection />
          <WeeklyAgenda />
          <FeaturedMenu />
          <LocationHours />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
