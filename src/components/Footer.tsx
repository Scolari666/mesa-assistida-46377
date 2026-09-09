import { Link } from "react-router-dom";
import { Instagram, Facebook } from "lucide-react";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import porksLogo from "@/assets/porks-logo.png";

export const Footer = () => {
  const { settings } = useStoreSettings();

  return (
    <footer className="bg-background border-t border-border">
      <div className="container px-4 md:px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <Link to="/" className="flex items-center gap-2">
            <img src={porksLogo} alt="Porks Santa Maria" className="h-10 w-10" />
            <span className="font-display text-lg tracking-wide">
              Porks <span className="text-primary">Santa Maria</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <a
              href={settings?.instagram_url || "https://instagram.com"}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-full border border-border hover:border-primary hover:text-primary transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href={settings?.facebook_url || "https://facebook.com"}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-full border border-border hover:border-primary hover:text-primary transition-colors"
              aria-label="Facebook"
            >
              <Facebook className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 text-sm text-muted-foreground pt-8 border-t border-border">
          <div>
            <p className="font-semibold text-foreground mb-1">Endereço</p>
            <p>Rua Serafim Valandro, 605</p>
            <p>Santa Maria - RS, 97010-480</p>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">Horário</p>
            <p>Seg-Qui 17h30-00h | Sex 17h30-1h</p>
            <p>Sáb 17h-1h | Dom 17h-23h30</p>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">Pedidos</p>
            <Link to="/cardapio" className="hover:text-primary transition-colors">
              Cardápio online
            </Link>
            <br />
            <Link to="/admin/login" className="hover:text-primary transition-colors">
              Acesso administrativo
            </Link>
          </div>
        </div>

        <div className="pt-6 mt-6 border-t border-border text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Porks Santa Maria. Porco &amp; Chope.
        </div>
      </div>
    </footer>
  );
};
