import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ChevronLeft, MapPin, Store, Zap, Loader2, CreditCard, Banknote, QrCode } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, maskPhone } from "@/lib/format";
import { useCart } from "@/contexts/CartContext";
import { useCustomer } from "@/contexts/CustomerContext";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { geocodeAddress } from "@/lib/geocode";
import { distanceKm } from "@/lib/distance";

type Fulfillment = "delivery" | "pickup";
type PaymentChoice = "pix_online" | "card_online" | "card_on_delivery" | "cash";

const CARD_BRANDS = ["Visa", "Mastercard", "Elo", "American Express", "Hipercard"];

const ERROR_MESSAGES: Record<string, string> = {
  STORE_CLOSED: "Estamos fechados no momento. Confira nossos horários e tente novamente.",
  INVALID_PHONE: "Telefone inválido. Volte e confira o número informado.",
  INVALID_NAME: "Nome inválido. Volte e confira seus dados.",
  INVALID_ADDRESS: "Endereço incompleto. Confira os campos e tente de novo.",
  OUT_OF_DELIVERY_RANGE: "Esse endereço está fora do nosso raio de entrega. Que tal retirar no balcão?",
  INVALID_FULFILLMENT: "Escolha como quer receber o pedido.",
  INVALID_PAYMENT: "Forma de pagamento inválida.",
  EMPTY_ORDER: "Seu carrinho está vazio.",
  INVALID_ITEM: "Um dos itens saiu do cardápio. Revise seu carrinho.",
  INVALID_VARIATION: "Uma das opções escolhidas não está mais disponível.",
  INVALID_QUANTITY: "Quantidade inválida em um dos itens.",
};

const Checkout = () => {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const { customer } = useCustomer();
  const { settings } = useStoreSettings();

  const [confirmOpen, setConfirmOpen] = useState(true);
  const [fulfillment, setFulfillment] = useState<Fulfillment | null>(null);
  const [payment, setPayment] = useState<PaymentChoice | null>(null);
  const [cardBrand, setCardBrand] = useState<string>(CARD_BRANDS[0]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [address, setAddress] = useState({
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "Santa Maria",
    state: "RS",
    zip: "",
    reference: "",
  });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    if (items.length === 0) navigate("/carrinho", { replace: true });
    else if (!customer) navigate("/identificar", { replace: true });
  }, [items.length, customer, navigate]);

  const payOnline = payment === "pix_online" || payment === "card_online";

  const estimatedFee = useMemo(() => {
    if (fulfillment !== "delivery" || !coords || !settings) return 0;
    const km = distanceKm(
      { lat: Number(settings.store_lat), lng: Number(settings.store_lng) },
      coords
    );
    return Math.round(km * Number(settings.delivery_fee_per_km) * 100) / 100;
  }, [fulfillment, coords, settings]);

  const estimatedDiscount = useMemo(() => {
    if (!payOnline || !settings) return 0;
    if (subtotal < Number(settings.online_discount_min_order)) return 0;
    return Math.round((subtotal * Number(settings.online_discount_percent)) / 100 * 100) / 100;
  }, [payOnline, settings, subtotal]);

  const estimatedTotal = subtotal + estimatedFee - estimatedDiscount;

  const handleGeocode = async () => {
    if (!address.street || !address.number) {
      toast.error("Preencha rua e número para calcular a entrega.");
      return;
    }
    setGeocoding(true);
    const result = await geocodeAddress(address);
    setGeocoding(false);

    if (!result) {
      toast.error("Não conseguimos localizar esse endereço. Revise os dados.");
      setCoords(null);
      return;
    }
    setCoords({ lat: result.lat, lng: result.lng });
    toast.success("Endereço localizado! Taxa de entrega calculada.");
  };

  const canSubmit =
    !!fulfillment &&
    !!payment &&
    (fulfillment === "pickup" || (!!coords && !!address.street && !!address.number)) &&
    !submitting;

  const handleConfirmOrder = async () => {
    if (!canSubmit || !customer) return;
    setSubmitting(true);

    const paymentMethod =
      payment === "pix_online" ? "pix" : payment === "cash" ? "cash" : "credit_card";

    const payload = {
      customer: { phone: customer.phone, name: customer.fullName },
      fulfillment:
        fulfillment === "delivery"
          ? {
              type: "delivery",
              address: {
                ...address,
                lat: coords?.lat,
                lng: coords?.lng,
              },
            }
          : { type: "pickup" },
      payment: {
        method: paymentMethod,
        pay_online: payOnline,
        card_brand: payment === "card_online" || payment === "card_on_delivery" ? cardBrand : null,
      },
      items: items.map((item) => ({
        product_id: item.productId,
        variation_id: item.variationId,
        quantity: item.quantity,
        notes: item.notes ?? null,
      })),
      notes: notes || null,
    };

    const { data, error } = await supabase.rpc("create_order", { payload });
    setSubmitting(false);

    if (error) {
      const code = Object.keys(ERROR_MESSAGES).find((key) => error.message.includes(key));
      toast.error(code ? ERROR_MESSAGES[code] : "Não foi possível enviar seu pedido. Tente novamente.");
      return;
    }

    const order = data as { id: string };
    try {
      sessionStorage.setItem(`porks_order_${order.id}`, JSON.stringify(data));
    } catch {
      // sessionStorage unavailable — order still shows from navigation state
    }
    clearCart();
    navigate(`/pedido/${order.id}`, { state: data });
  };

  if (!customer) return null;

  const minMinutes = settings?.min_delivery_minutes ?? 20;
  const maxMinutes = settings?.max_delivery_minutes ?? 180;
  const discountPercent = Number(settings?.online_discount_percent ?? 10);

  return (
    <>
      <Helmet>
        <title>Finalizar pedido - Porks Santa Maria</title>
      </Helmet>

      <div className="min-h-screen bg-background pb-32">
        <Navbar />

        <div className="container px-4 md:px-6 py-6 max-w-2xl">
          <Button variant="ghost" size="sm" className="mb-4 -ml-2" asChild>
            <Link to="/carrinho">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Voltar
            </Link>
          </Button>

          <h1 className="text-3xl md:text-4xl mb-6">Finalizar pedido</h1>

          <div className="flex items-center justify-between bg-card border border-border rounded-lg p-4 mb-6">
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Este pedido será entregue a:</p>
              <p className="font-semibold truncate">{customer.fullName}</p>
              <p className="text-sm text-muted-foreground">{maskPhone(customer.phone)}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/identificar")}>
              Trocar
            </Button>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl mb-4">Escolha como receber o pedido</h2>
            <div className="space-y-3">
              <button
                onClick={() => setFulfillment("delivery")}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  fulfillment === "delivery" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">Cadastrar novo endereço</span>
                      <Badge className="bg-primary text-primary-foreground text-[10px]">
                        <Zap className="h-3 w-3 mr-1" />
                        Entrega mais rápida
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Receba em casa em {minMinutes}-{maxMinutes} min
                    </p>
                  </div>
                </div>
              </button>

              {fulfillment === "delivery" && (
                <div className="p-4 rounded-lg border border-border bg-card space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <Label htmlFor="street">Rua</Label>
                      <Input
                        id="street"
                        value={address.street}
                        onChange={(e) => {
                          setAddress({ ...address, street: e.target.value });
                          setCoords(null);
                        }}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="number">Número</Label>
                      <Input
                        id="number"
                        value={address.number}
                        onChange={(e) => {
                          setAddress({ ...address, number: e.target.value });
                          setCoords(null);
                        }}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="neighborhood">Bairro</Label>
                      <Input
                        id="neighborhood"
                        value={address.neighborhood}
                        onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="complement">Complemento</Label>
                      <Input
                        id="complement"
                        value={address.complement}
                        onChange={(e) => setAddress({ ...address, complement: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="city">Cidade</Label>
                      <Input
                        id="city"
                        value={address.city}
                        onChange={(e) => {
                          setAddress({ ...address, city: e.target.value });
                          setCoords(null);
                        }}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="zip">CEP</Label>
                      <Input
                        id="zip"
                        value={address.zip}
                        onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="reference">Ponto de referência</Label>
                    <Input
                      id="reference"
                      value={address.reference}
                      onChange={(e) => setAddress({ ...address, reference: e.target.value })}
                      className="mt-1"
                    />
                  </div>

                  <Button variant="outline" onClick={handleGeocode} disabled={geocoding} className="w-full">
                    {geocoding ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Localizando endereço...
                      </>
                    ) : (
                      "Calcular taxa de entrega"
                    )}
                  </Button>

                  {coords && (
                    <p className="text-sm text-center">
                      Taxa de entrega estimada:{" "}
                      <span className="font-semibold text-primary">{formatCurrency(estimatedFee)}</span>
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={() => setFulfillment("pickup")}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  fulfillment === "pickup" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Store className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1 flex items-start justify-between gap-2">
                    <div>
                      <span className="font-semibold">Buscar o pedido</span>
                      <p className="text-sm text-muted-foreground">
                        Retire no balcão: {settings?.address_street ?? "Rua Serafim Valandro"},{" "}
                        {settings?.address_number ?? "605"}
                      </p>
                    </div>
                    <span className="font-semibold text-primary whitespace-nowrap">Grátis</span>
                  </div>
                </div>
              </button>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl mb-4">Escolha a forma de pagamento</h2>

            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <p className="font-semibold uppercase text-sm tracking-wide">Pagar agora</p>
                <Badge className="bg-primary text-primary-foreground text-[10px]">Mais rápido</Badge>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => setPayment("pix_online")}
                  className={`w-full flex items-center gap-3 p-4 rounded-lg border text-left transition-colors ${
                    payment === "pix_online" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  }`}
                >
                  <QrCode className="h-5 w-5 text-primary" />
                  <span className="flex-1 font-medium">Pix</span>
                  <Badge variant="outline" className="border-primary text-primary">
                    {discountPercent.toFixed(0)}% OFF
                  </Badge>
                </button>

                <button
                  onClick={() => setPayment("card_online")}
                  className={`w-full flex items-center gap-3 p-4 rounded-lg border text-left transition-colors ${
                    payment === "card_online" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  }`}
                >
                  <CreditCard className="h-5 w-5 text-primary" />
                  <span className="flex-1 font-medium">Cartão de crédito</span>
                  <Badge variant="outline" className="border-primary text-primary">
                    {discountPercent.toFixed(0)}% OFF
                  </Badge>
                </button>
              </div>
            </div>

            <div className="mb-4">
              <p className="font-semibold uppercase text-sm tracking-wide mb-2">
                Pagar na {fulfillment === "pickup" ? "retirada" : "entrega"}
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => setPayment("card_on_delivery")}
                  className={`w-full flex items-center gap-3 p-4 rounded-lg border text-left transition-colors ${
                    payment === "card_on_delivery"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <span className="flex-1 font-medium">Cartão na maquininha</span>
                </button>

                <button
                  onClick={() => setPayment("cash")}
                  className={`w-full flex items-center gap-3 p-4 rounded-lg border text-left transition-colors ${
                    payment === "cash" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  }`}
                >
                  <Banknote className="h-5 w-5 text-muted-foreground" />
                  <span className="flex-1 font-medium">Dinheiro</span>
                </button>
              </div>
            </div>

            {(payment === "card_online" || payment === "card_on_delivery") && (
              <div className="p-4 rounded-lg border border-border bg-card">
                <Label>Bandeira do cartão</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {CARD_BRANDS.map((brand) => (
                    <button
                      key={brand}
                      onClick={() => setCardBrand(brand)}
                      className={`px-3 py-1.5 rounded-md border text-sm transition-colors ${
                        cardBrand === brand
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {payOnline && estimatedDiscount === 0 && settings && (
              <p className="text-sm text-muted-foreground mt-3">
                O desconto de {discountPercent.toFixed(0)}% vale para pedidos a partir de{" "}
                {formatCurrency(Number(settings.online_discount_min_order))}.
              </p>
            )}
          </section>

          <Accordion type="single" collapsible className="mb-8">
            <AccordionItem value="notes">
              <AccordionTrigger className="font-semibold">Observações do pedido</AccordionTrigger>
              <AccordionContent>
                <Textarea
                  placeholder="Ex.: sem cebola, ponto da carne, troco para R$100..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="bg-card border border-border rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Taxa de entrega</span>
              <span>{fulfillment === "pickup" ? "Grátis" : formatCurrency(estimatedFee)}</span>
            </div>
            {estimatedDiscount > 0 && (
              <div className="flex justify-between text-sm text-primary">
                <span>Desconto pagamento online</span>
                <span>-{formatCurrency(estimatedDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(estimatedTotal)}</span>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border p-4">
          <div className="container max-w-2xl px-0">
            <Button
              size="lg"
              disabled={!canSubmit}
              onClick={handleConfirmOrder}
              className="w-full flex items-center justify-between font-display text-lg tracking-wide"
            >
              {submitting ? (
                <span className="flex items-center gap-2 mx-auto">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Enviando pedido...
                </span>
              ) : (
                <>
                  <span>Confirmar pedido</span>
                  <span>{formatCurrency(estimatedTotal)}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display tracking-wide">Confirme seus dados</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Nome</p>
              <p className="font-semibold">{customer.fullName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Telefone</p>
              <p className="font-semibold">{maskPhone(customer.phone)}</p>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => navigate("/identificar")} className="w-full sm:w-auto">
              Editar informações
            </Button>
            <Button onClick={() => setConfirmOpen(false)} className="w-full sm:w-auto">
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Checkout;
