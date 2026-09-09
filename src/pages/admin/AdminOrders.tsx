import { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, MapPin, Store, Phone, Clock } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, maskPhone } from "@/lib/format";
import { Tables } from "@/integrations/supabase/types";

type Order = Tables<"orders">;
type OrderItem = Tables<"order_items">;
type OrderStatus = Order["status"];

const STATUS_LABELS: Record<OrderStatus, string> = {
  received: "Recebido",
  preparing: "Em preparo",
  out_for_delivery: "Saiu para entrega",
  ready_for_pickup: "Pronto para retirada",
  delivered: "Entregue",
  picked_up: "Retirado",
  cancelled: "Cancelado",
};

const STATUS_STYLES: Record<OrderStatus, string> = {
  received: "bg-primary text-primary-foreground",
  preparing: "bg-amber-500 text-black",
  out_for_delivery: "bg-blue-500 text-white",
  ready_for_pickup: "bg-blue-500 text-white",
  delivered: "bg-emerald-600 text-white",
  picked_up: "bg-emerald-600 text-white",
  cancelled: "bg-muted text-muted-foreground",
};

const PAYMENT_LABELS: Record<string, string> = {
  pix: "Pix",
  credit_card: "Cartão de crédito",
  cash: "Dinheiro",
};

function nextStatuses(order: Order): OrderStatus[] {
  switch (order.status) {
    case "received":
      return ["preparing", "cancelled"];
    case "preparing":
      return [order.fulfillment_type === "delivery" ? "out_for_delivery" : "ready_for_pickup", "cancelled"];
    case "out_for_delivery":
      return ["delivered", "cancelled"];
    case "ready_for_pickup":
      return ["picked_up", "cancelled"];
    default:
      return [];
  }
}

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [selected, setSelected] = useState<Order | null>(null);
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(200);

    if (statusFilter !== "all") query = query.eq("status", statusFilter as OrderStatus);
    if (dateFilter) {
      const start = new Date(`${dateFilter}T00:00:00`);
      const end = new Date(`${dateFilter}T23:59:59`);
      query = query.gte("created_at", start.toISOString()).lte("created_at", end.toISOString());
    }

    const { data, error } = await query;
    setLoading(false);
    if (error) {
      toast.error("Erro ao carregar pedidos");
      return;
    }
    setOrders(data ?? []);
  }, [statusFilter, dateFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const channel = supabase
      .channel("admin-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchOrders())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  const openDetail = async (order: Order) => {
    setSelected(order);
    const { data } = await supabase.from("order_items").select("*").eq("order_id", order.id);
    setSelectedItems(data ?? []);
  };

  const updateStatus = async (order: Order, status: OrderStatus) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", order.id);
    if (error) {
      toast.error("Erro ao atualizar status");
      return;
    }
    toast.success(`Pedido marcado como "${STATUS_LABELS[status]}"`);
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status } : o)));
    setSelected((prev) => (prev && prev.id === order.id ? { ...prev, status } : prev));
  };

  const pendingCount = useMemo(() => orders.filter((o) => o.status === "received").length, [orders]);

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

  return (
    <AdminLayout>
      <Helmet>
        <title>Pedidos - Painel Porks</title>
      </Helmet>

      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl">Pedidos</h1>
          <p className="text-muted-foreground text-sm">
            {pendingCount > 0 ? `${pendingCount} novo(s) aguardando confirmação` : "Nenhum pedido novo no momento"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((status) => (
                <SelectItem key={status} value={status}>
                  {STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-44"
          />
          {dateFilter && (
            <Button variant="ghost" size="sm" onClick={() => setDateFilter("")}>
              Limpar data
            </Button>
          )}
          <Button variant="outline" size="icon" onClick={fetchOrders} title="Atualizar">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground py-12 text-center">Carregando pedidos...</p>
      ) : orders.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">Nenhum pedido encontrado com esses filtros.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <button
              key={order.id}
              onClick={() => openDetail(order)}
              className={`w-full text-left bg-card border rounded-lg p-4 transition-colors hover:border-primary ${
                order.status === "received" ? "border-primary shadow-glow" : "border-border"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-display tracking-wide">#{order.id.slice(0, 8).toUpperCase()}</span>
                    <Badge className={STATUS_STYLES[order.status]}>{STATUS_LABELS[order.status]}</Badge>
                    <Badge variant="outline">
                      {order.fulfillment_type === "delivery" ? "Entrega" : "Retirada"}
                    </Badge>
                    {order.pay_online && <Badge variant="outline">Pago online</Badge>}
                  </div>
                  <p className="text-sm">
                    {order.customer_name} · {maskPhone(order.customer_phone)}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(order.created_at)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{formatCurrency(Number(order.total))}</p>
                  <p className="text-xs text-muted-foreground">
                    {PAYMENT_LABELS[order.payment_method] ?? order.payment_method}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display tracking-wide flex items-center gap-2">
                  Pedido #{selected.id.slice(0, 8).toUpperCase()}
                  <Badge className={STATUS_STYLES[selected.status]}>{STATUS_LABELS[selected.status]}</Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-semibold">{selected.customer_name}</p>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {maskPhone(selected.customer_phone)}
                  </p>
                  <p className="text-muted-foreground">{formatTime(selected.created_at)}</p>
                </div>

                <div className="border-t border-border pt-3">
                  <div className="flex items-center gap-2 font-semibold mb-1">
                    {selected.fulfillment_type === "delivery" ? (
                      <MapPin className="h-4 w-4 text-primary" />
                    ) : (
                      <Store className="h-4 w-4 text-primary" />
                    )}
                    {selected.fulfillment_type === "delivery" ? "Entrega" : "Retirada no balcão"}
                  </div>
                  {selected.fulfillment_type === "delivery" && selected.address_snapshot && (
                    <div className="text-muted-foreground">
                      {(() => {
                        const addr = selected.address_snapshot as Record<string, string>;
                        return (
                          <>
                            <p>
                              {addr.street}, {addr.number}
                              {addr.complement ? ` - ${addr.complement}` : ""}
                            </p>
                            <p>
                              {addr.neighborhood ? `${addr.neighborhood} · ` : ""}
                              {addr.city}/{addr.state}
                            </p>
                            {addr.reference && <p>Ref.: {addr.reference}</p>}
                            {selected.distance_km != null && (
                              <p>{Number(selected.distance_km).toFixed(1)} km do bar</p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>

                <div className="border-t border-border pt-3">
                  <p className="font-semibold mb-2">Itens</p>
                  <ul className="space-y-1">
                    {selectedItems.map((item) => (
                      <li key={item.id} className="flex justify-between gap-3">
                        <span>
                          {item.quantity}x {item.product_name}
                          {item.variation_name ? ` (${item.variation_name})` : ""}
                        </span>
                        <span className="whitespace-nowrap">{formatCurrency(Number(item.line_total))}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {selected.notes && (
                  <div className="border-t border-border pt-3">
                    <p className="font-semibold">Observações</p>
                    <p className="text-muted-foreground">{selected.notes}</p>
                  </div>
                )}

                <div className="border-t border-border pt-3 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(Number(selected.subtotal))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxa de entrega</span>
                    <span>{formatCurrency(Number(selected.delivery_fee))}</span>
                  </div>
                  {Number(selected.discount_amount) > 0 && (
                    <div className="flex justify-between text-primary">
                      <span>Desconto online</span>
                      <span>-{formatCurrency(Number(selected.discount_amount))}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base pt-1">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(Number(selected.total))}</span>
                  </div>
                  <p className="text-muted-foreground pt-1">
                    {PAYMENT_LABELS[selected.payment_method] ?? selected.payment_method}
                    {selected.card_brand ? ` · ${selected.card_brand}` : ""}
                    {selected.pay_online ? " · pago online" : " · pagar na entrega/retirada"}
                  </p>
                </div>

                {nextStatuses(selected).length > 0 && (
                  <div className="border-t border-border pt-3 flex flex-wrap gap-2">
                    {nextStatuses(selected).map((status) => (
                      <Button
                        key={status}
                        size="sm"
                        variant={status === "cancelled" ? "outline" : "default"}
                        onClick={() => updateStatus(selected, status)}
                      >
                        {STATUS_LABELS[status]}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminOrders;
