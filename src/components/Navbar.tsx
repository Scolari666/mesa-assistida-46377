import { Button } from "@/components/ui/button";
import { Menu, X, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import porksLogo from "@/assets/porks-logo.png";

const NAV_LINKS = [
  { href: "/#o-lugar", label: "O Lugar" },
  { href: "/#agenda", label: "Agenda" },
  { href: "/#cardapio", label: "Cardápio" },
  { href: "/#local", label: "Local" },
];

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { itemCount } = useCart();

  return (
    <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-lg border-b border-border">
      <div className="container px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <img src={porksLogo} alt="Porks Santa Maria" className="h-11 w-11" />
            <span className="font-display text-xl tracking-wide leading-none">
              Porks <span className="text-primary">Santa Maria</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-semibold uppercase tracking-wide hover:text-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Button asChild className="font-display tracking-wide">
              <Link to="/cardapio">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Peça Já {itemCount > 0 && `(${itemCount})`}
              </Link>
            </Button>
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Abrir menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="text-sm font-semibold uppercase tracking-wide hover:text-primary transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <Button asChild className="w-full font-display tracking-wide">
                <Link to="/cardapio" onClick={() => setIsOpen(false)}>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Peça Já {itemCount > 0 && `(${itemCount})`}
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
