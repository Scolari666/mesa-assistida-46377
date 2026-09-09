import { Button } from "@/components/ui/button";
import { motion, type Variants } from "framer-motion";
import { Link } from "react-router-dom";
import { ShoppingBag, MapPin } from "lucide-react";
import { useParallax } from "@/hooks/useParallax";
import porksLogo from "@/assets/porks-logo.png";

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export const Hero = () => {
  const { ref, offset } = useParallax(0.15);

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className="relative min-h-[92vh] flex items-center overflow-hidden bg-background"
    >
      <div
        className="absolute inset-0 bg-halftone-dense opacity-40"
        style={{ transform: `translateY(${offset}px)` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/70 to-background" />

      <div className="container relative z-10 px-4 md:px-6 py-20">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <motion.div variants={container} initial="hidden" animate="show">
            <motion.span
              variants={item}
              className="inline-block px-4 py-1.5 mb-6 rounded-full border border-primary/40 bg-primary/10 text-primary text-sm font-semibold uppercase tracking-widest"
            >
              Porco &amp; Chope desde sempre
            </motion.span>

            <motion.h1
              variants={item}
              className="text-6xl sm:text-7xl md:text-8xl leading-[0.9] mb-6"
            >
              <span className="block">PORKS</span>
              <span className="block font-hand text-primary text-5xl sm:text-6xl md:text-7xl normal-case -mt-1">
                Santa Maria
              </span>
            </motion.h1>

            <motion.p variants={item} className="text-lg md:text-xl text-muted-foreground max-w-md mb-8">
              Costela no bafo, chope estalando gelado e petiscos que não perdoam. Peça
              online e receba em casa ou retire quentinho no balcão.
            </motion.p>

            <motion.div variants={item} className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="font-display text-lg tracking-wide shadow-elegant hover:shadow-glow transition-all duration-300 hover:-translate-y-0.5"
                asChild
              >
                <Link to="/cardapio">
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  Ver Cardápio e Pedir
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="font-display text-lg tracking-wide border-2 hover:-translate-y-0.5 transition-all duration-300"
                asChild
              >
                <a href="#local">
                  <MapPin className="mr-2 h-5 w-5" />
                  Como Chegar
                </a>
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="hidden md:flex justify-center"
          >
            <img
              src={porksLogo}
              alt="Mascote Porks"
              className="w-full max-w-sm drop-shadow-[0_0_40px_rgba(230,57,70,0.35)]"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
