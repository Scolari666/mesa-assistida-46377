import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { HowItWorks } from "@/components/HowItWorks";
import { CTA } from "@/components/CTA";
import { Footer } from "@/components/Footer";
import { Helmet } from "react-helmet";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>MenuFacil Pro - Cardápio Digital com Botão de Chamar Atendente</title>
        <meta 
          name="description" 
          content="Transforme seu restaurante com cardápio digital via QR Code e botão para chamar atendente. Reduza custos, elimine espera e melhore a experiência do cliente." 
        />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-subtle">
        <Navbar />
        <main>
          <Hero />
          <Features />
          <HowItWorks />
          <CTA />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
