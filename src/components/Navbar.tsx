import { Button } from "@/components/ui/button";
import { Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="container px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-hero flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-foreground">M</span>
            </div>
            <span className="text-xl font-bold">MenuFacil Pro</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
              Início
            </Link>
            <Link to="/menu-demo" className="text-sm font-medium hover:text-primary transition-colors">
              Demo
            </Link>
            <Link to="/pricing" className="text-sm font-medium hover:text-primary transition-colors">
              Preços
            </Link>
            {user && (
              <>
                <Link to="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
                  Dashboard
                </Link>
                <Link to="/menu-management" className="text-sm font-medium hover:text-primary transition-colors">
                  Cardápio
                </Link>
              </>
            )}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Button variant="ghost" onClick={signOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" asChild>
                  <Link to="/auth">Entrar</Link>
                </Button>
                <Button asChild>
                  <Link to="/auth">Começar Grátis</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border/50">
            <div className="flex flex-col space-y-4">
              <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
                Início
              </Link>
              <Link to="/menu-demo" className="text-sm font-medium hover:text-primary transition-colors">
                Demo
              </Link>
              <Link to="/pricing" className="text-sm font-medium hover:text-primary transition-colors">
                Preços
              </Link>
              {user && (
                <>
                  <Link to="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
                    Dashboard
                  </Link>
                  <Link to="/menu-management" className="text-sm font-medium hover:text-primary transition-colors">
                    Cardápio
                  </Link>
                </>
              )}
              <div className="flex flex-col gap-2 pt-4">
                {user ? (
                  <Button variant="outline" className="w-full" onClick={signOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/auth">Entrar</Link>
                    </Button>
                    <Button className="w-full" asChild>
                      <Link to="/auth">Começar Grátis</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
