import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ClipboardList, UtensilsCrossed, Settings, LogOut, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import porksLogo from "@/assets/porks-logo.png";

const NAV = [
  { to: "/admin", label: "Pedidos", icon: ClipboardList },
  { to: "/admin/cardapio", label: "Cardápio", icon: UtensilsCrossed },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export const AdminLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 z-40 bg-background/95 backdrop-blur-lg">
        <div className="container px-4 md:px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/admin" className="flex items-center gap-2 flex-shrink-0">
            <img src={porksLogo} alt="Porks" className="h-9 w-9" />
            <span className="font-display tracking-wide hidden sm:block">
              Painel <span className="text-primary">Porks</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1 overflow-x-auto">
            {NAV.map((entry) => {
              const active =
                entry.to === "/admin"
                  ? location.pathname === "/admin"
                  : location.pathname.startsWith(entry.to);
              return (
                <Link
                  key={entry.to}
                  to={entry.to}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold whitespace-nowrap transition-colors ${
                    active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                >
                  <entry.icon className="h-4 w-4" />
                  <span className="hidden md:inline">{entry.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="ghost" size="icon" asChild title="Ver site">
              <a href="/" target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 md:px-6 py-6">{children}</main>
    </div>
  );
};
