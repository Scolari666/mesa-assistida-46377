import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ShieldCheck, Loader2 } from "lucide-react";
import { maskPhone, isValidPhone } from "@/lib/format";
import { useCustomer } from "@/contexts/CustomerContext";
import { useCart } from "@/contexts/CartContext";

const Identify = () => {
  const navigate = useNavigate();
  const { customer, lookupByPhone, identify } = useCustomer();
  const { items } = useCart();

  const [phone, setPhone] = useState(customer ? maskPhone(customer.phone) : "");
  const [name, setName] = useState(customer?.fullName ?? "");
  const [recognized, setRecognized] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (items.length === 0) navigate("/carrinho", { replace: true });
  }, [items.length, navigate]);

  useEffect(() => {
    if (!isValidPhone(phone)) {
      setRecognized(false);
      return;
    }

    let active = true;
    setChecking(true);
    lookupByPhone(phone)
      .then((found) => {
        if (!active) return;
        if (found) {
          setName(found.fullName);
          setRecognized(true);
        } else {
          setRecognized(false);
        }
      })
      .finally(() => {
        if (active) setChecking(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone]);

  const canProceed = isValidPhone(phone) && name.trim().length >= 2;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canProceed) return;
    identify({ phone: phone.replace(/\D/g, ""), fullName: name.trim() });
    navigate("/finalizar");
  };

  return (
    <>
      <Helmet>
        <title>Identifique-se - Porks Santa Maria</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />

        <div className="container px-4 md:px-6 py-6 max-w-lg">
          <Button variant="ghost" size="sm" className="mb-4 -ml-2" asChild>
            <Link to="/carrinho">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Voltar ao carrinho
            </Link>
          </Button>

          <h1 className="text-3xl md:text-4xl mb-3">Identifique-se</h1>
          <p className="text-muted-foreground mb-8">
            Para realizar seu pedido vamos precisar de suas informações. Este é um ambiente
            protegido — usamos seus dados apenas para entregar o pedido.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="phone">Telefone (WhatsApp)</Label>
              <div className="relative">
                <Input
                  id="phone"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(__) _____-____"
                  value={phone}
                  onChange={(e) => setPhone(maskPhone(e.target.value))}
                  className="mt-1.5"
                />
                {checking && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {recognized && (
                <p className="text-sm text-primary mt-1.5">
                  Que bom te ver de novo! Já preenchemos seu nome.
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                autoComplete="name"
                placeholder="Seu nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <span>Ambiente protegido. Não pedimos senha nem dados de cartão aqui.</span>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={!canProceed}
              className="w-full font-display text-lg tracking-wide"
            >
              Avançar
            </Button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Identify;
