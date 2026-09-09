import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Store, MapPin } from "lucide-react";
import { formatCurrency } from "@/lib/format";

interface OrderItemResult {
  product_name: string;
  variation_name: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface OrderResult {
  id: string;
  status: string;
  fulfillment_type: "delivery" | "pickup";
  delivery_fee: number;
  distance_km: number | null;
  subtotal: number;
  discount_amount: number;
  total: number;
  payment_method: string;
  pay_online: boolean;
  created_at: string;
  min_delivery_minutes: number;
  max_delivery_minutes: number;
  items: OrderItemResult[];
}

const PAYMENT_LABELS: Record<string, string> = {
  pix: "Pix",
  credit_card: "Cartão de crédito",
  cash: "Dinheiro",
};

const OrderStatus = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [order, setOrder] = useState<OrderResult | null>((location.state as OrderResult) ?? null);

  useEffect(() => {
    if (order || !id) return;
    try {
      const stored = sessionStorage.getItem(`porks_order_${id}`);
      if (stored) setOrder(JSON.parse(stored) as OrderResult);
    } catch {
      // no cached order available
    }
  }, [id, order]);

  return (
    <>
      <Helmet>
        <title>Pedido confirmado - Porks Santa Maria</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />

        <div className="container px-4 md:px-6 py-10 max-w-2xl">
          <div className="text-center mb-8">
            <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4" />
            <span className="font-hand text-primary text-2xl">Valeu!</span>
            <h1 className="text-3xl md:text-4xl mb-2">Pedido recebido</h1>
            <p className="text-muted-foreground">
              Pedido #{id?.slice(0, 8).toUpperCase()} — já estamos preparando tudo.
            </p>
          </div>

          {order ? (
            <>
              <div className="bg-card border border-border rounded-lg p-5 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  {order.fulfillment_type === "delivery" ? (
                    <MapPin className="h-5 w-5 text-primary" />
                  ) : (
                    <Store className="h-5 w-5 text-primary" />
                  )}
                  <div>
                    <p className="font-semibold">
                      {order.fulfillment_type === "delivery" ? "Entrega" : "Retirada no balcão"}
                    </p>
                    {order.fulfillment_type === "delivery" && order.distance_km != null && (
                      <p className="text-sm text-muted-foreground">
                        {Number(order.distance_km).toFixed(1)} km do bar
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <p className="text-sm">
                    Previsão: {order.min_delivery_minutes}-{order.max_delivery_minutes} min
                  </p>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-5 mb-6">
                <h2 className="text-xl mb-4">Resumo</h2>
                <ul className="space-y-2 mb-4">
                  {order.items.map((item, index) => (
                    <li key={index} className="flex justify-between text-sm gap-4">
                      <span>
                        {item.quantity}x {item.product_name}
                        {item.variation_name ? ` (${item.variation_name})` : ""}
                      </span>
                      <span className="whitespace-nowrap">{formatCurrency(Number(item.line_total))}</span>
                    </li>
                  ))}
                </ul>

                <div className="space-y-1.5 pt-4 border-t border-border text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(Number(order.subtotal))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxa de entrega</span>
                    <span>
                      {Number(order.delivery_fee) === 0 ? "Grátis" : formatCurrency(Number(order.delivery_fee))}
                    </span>
                  </div>
                  {Number(order.discount_amount) > 0 && (
                    <div className="flex justify-between text-primary">
                      <span>Desconto pagamento online</span>
                      <span>-{formatCurrency(Number(order.discount_amount))}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(Number(order.total))}</span>
                  </div>
                  <p className="text-muted-foreground pt-2">
                    Pagamento: {PAYMENT_LABELS[order.payment_method] ?? order.payment_method}
                    {order.pay_online ? " (pago online)" : " (na entrega/retirada)"}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground mb-6">
              Pedido registrado. Guarde o número acima para acompanhar com a equipe.
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild size="lg" className="flex-1 font-display tracking-wide">
              <Link to="/cardapio">Fazer novo pedido</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="flex-1 border-2">
              <Link to="/">Voltar ao início</Link>
            </Button>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default OrderStatus;
