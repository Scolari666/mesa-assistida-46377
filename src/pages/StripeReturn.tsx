import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";

const POLL_INTERVAL_MS = 1500;
const TIMEOUT_MS = 30000;

/**
 * Stripe redirects here after a successful Checkout Session. The order
 * itself is only created once our webhook hears from Stripe, which usually
 * lands within a second or two but isn't guaranteed to beat this redirect —
 * so this page polls until it shows up, then hands off to the normal order
 * status screen.
 */
const StripeReturn = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [timedOut, setTimedOut] = useState(false);
  const clearedCart = useRef(false);

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!sessionId) {
      navigate("/", { replace: true });
      return;
    }

    let cancelled = false;
    const startedAt = Date.now();

    const poll = async () => {
      const { data } = await supabase.rpc("get_order_by_stripe_session", { p_session_id: sessionId });
      if (cancelled) return;

      const result = data as { status?: string; id?: string } | null;

      if (result && result.status !== "pending" && result.id) {
        if (!clearedCart.current) {
          clearedCart.current = true;
          clearCart();
        }
        try {
          sessionStorage.setItem(`porks_order_${result.id}`, JSON.stringify(result));
        } catch {
          // sessionStorage unavailable — order still shows from navigation state
        }
        navigate(`/pedido/${result.id}`, { replace: true, state: result });
        return;
      }

      if (Date.now() - startedAt > TIMEOUT_MS) {
        setTimedOut(true);
        return;
      }

      setTimeout(poll, POLL_INTERVAL_MS);
    };

    poll();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  return (
    <>
      <Helmet>
        <title>Confirmando pagamento - Porks Santa Maria</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />

        <div className="container px-4 md:px-6 py-20 max-w-md text-center">
          {!timedOut ? (
            <>
              <Loader2 className="h-12 w-12 text-primary mx-auto mb-6 animate-spin" />
              <h1 className="text-2xl mb-2">Confirmando seu pagamento...</h1>
              <p className="text-muted-foreground">
                Isso leva só alguns segundos. Não feche esta página.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl mb-2">Ainda confirmando</h1>
              <p className="text-muted-foreground mb-6">
                Seu pagamento pode ter sido aprovado, mas ainda não recebemos a confirmação.
                Se o valor foi debitado, seu pedido será registrado em instantes — ou entre em
                contato com a gente informando o pagamento.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => window.location.reload()}>Tentar de novo</Button>
                <Button variant="outline" asChild>
                  <Link to="/">Voltar ao início</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default StripeReturn;
