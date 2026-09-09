import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Tables } from "@/integrations/supabase/types";
import { geocodeAddress } from "@/lib/geocode";
import { formatDayLabel, type BusinessHours } from "@/lib/businessHours";

type StoreSettings = Tables<"store_settings">;

const AdminSettings = () => {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [hours, setHours] = useState<BusinessHours>({});
  const [saving, setSaving] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    supabase
      .from("store_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => {
        setSettings(data);
        if (data) setHours(data.business_hours as unknown as BusinessHours);
      });
  }, []);

  const update = <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleGeocodeStore = async () => {
    if (!settings) return;
    setGeocoding(true);
    const result = await geocodeAddress({
      street: settings.address_street,
      number: settings.address_number,
      neighborhood: settings.address_neighborhood ?? undefined,
      city: settings.address_city,
      state: settings.address_state,
    });
    setGeocoding(false);

    if (!result) {
      toast.error("Não foi possível localizar o endereço.");
      return;
    }
    update("store_lat", result.lat);
    update("store_lng", result.lng);
    toast.success("Coordenadas atualizadas a partir do endereço.");
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);

    const { error } = await supabase
      .from("store_settings")
      .update({
        store_name: settings.store_name,
        address_street: settings.address_street,
        address_number: settings.address_number,
        address_neighborhood: settings.address_neighborhood,
        address_city: settings.address_city,
        address_state: settings.address_state,
        address_zip: settings.address_zip,
        store_lat: Number(settings.store_lat),
        store_lng: Number(settings.store_lng),
        delivery_fee_per_km: Number(settings.delivery_fee_per_km),
        max_delivery_radius_km: Number(settings.max_delivery_radius_km),
        online_discount_percent: Number(settings.online_discount_percent),
        online_discount_min_order: Number(settings.online_discount_min_order),
        min_delivery_minutes: Number(settings.min_delivery_minutes),
        max_delivery_minutes: Number(settings.max_delivery_minutes),
        whatsapp_phone: settings.whatsapp_phone,
        instagram_url: settings.instagram_url,
        facebook_url: settings.facebook_url,
        business_hours: hours as unknown as StoreSettings["business_hours"],
      })
      .eq("id", 1);

    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar configurações.");
      return;
    }
    toast.success("Configurações salvas!");
  };

  if (!settings) {
    return (
      <AdminLayout>
        <p className="text-muted-foreground py-12 text-center">Carregando configurações...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Helmet>
        <title>Configurações - Painel Porks</title>
      </Helmet>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl">Configurações</h1>
        <Button onClick={handleSave} disabled={saving} className="font-display tracking-wide">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 max-w-5xl">
        <section className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-xl mb-4">Entrega</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="fee">Valor por km (R$)</Label>
              <Input
                id="fee"
                type="number"
                step="0.01"
                value={settings.delivery_fee_per_km}
                onChange={(e) => update("delivery_fee_per_km", Number(e.target.value))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="radius">Raio máximo de entrega (km)</Label>
              <Input
                id="radius"
                type="number"
                step="0.5"
                value={settings.max_delivery_radius_km}
                onChange={(e) => update("max_delivery_radius_km", Number(e.target.value))}
                className="mt-1.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="min-min">Tempo mín. (min)</Label>
                <Input
                  id="min-min"
                  type="number"
                  value={settings.min_delivery_minutes}
                  onChange={(e) => update("min_delivery_minutes", Number(e.target.value))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="max-min">Tempo máx. (min)</Label>
                <Input
                  id="max-min"
                  type="number"
                  value={settings.max_delivery_minutes}
                  onChange={(e) => update("max_delivery_minutes", Number(e.target.value))}
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-xl mb-4">Desconto pagamento online</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="discount">Percentual de desconto (%)</Label>
              <Input
                id="discount"
                type="number"
                step="0.5"
                value={settings.online_discount_percent}
                onChange={(e) => update("online_discount_percent", Number(e.target.value))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="min-order">Pedido mínimo para o desconto (R$)</Label>
              <Input
                id="min-order"
                type="number"
                step="0.01"
                value={settings.online_discount_min_order}
                onChange={(e) => update("online_discount_min_order", Number(e.target.value))}
                className="mt-1.5"
              />
            </div>
          </div>
        </section>

        <section className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-xl mb-4">Endereço do estabelecimento</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Label htmlFor="street">Rua</Label>
                <Input
                  id="street"
                  value={settings.address_street}
                  onChange={(e) => update("address_street", e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="number">Número</Label>
                <Input
                  id="number"
                  value={settings.address_number}
                  onChange={(e) => update("address_number", e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={settings.address_city}
                  onChange={(e) => update("address_city", e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="zip">CEP</Label>
                <Input
                  id="zip"
                  value={settings.address_zip}
                  onChange={(e) => update("address_zip", e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="lat">Latitude</Label>
                <Input
                  id="lat"
                  type="number"
                  step="0.000001"
                  value={settings.store_lat}
                  onChange={(e) => update("store_lat", Number(e.target.value))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="lng">Longitude</Label>
                <Input
                  id="lng"
                  type="number"
                  step="0.000001"
                  value={settings.store_lng}
                  onChange={(e) => update("store_lng", Number(e.target.value))}
                  className="mt-1.5"
                />
              </div>
            </div>
            <Button variant="outline" onClick={handleGeocodeStore} disabled={geocoding} className="w-full">
              {geocoding ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <MapPin className="mr-2 h-4 w-4" />
              )}
              Buscar coordenadas pelo endereço
            </Button>
            <p className="text-xs text-muted-foreground">
              As coordenadas são a origem do cálculo de distância da taxa de entrega.
            </p>
          </div>
        </section>

        <section className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-xl mb-4">Horário de funcionamento</h2>
          <p className="text-xs text-muted-foreground mb-3">
            Pedidos fora do horário são bloqueados. Use 00:00 no fechamento para "até meia-noite".
          </p>
          <div className="space-y-2">
            {[0, 1, 2, 3, 4, 5, 6].map((dow) => {
              const day = hours[String(dow)] ?? { open: "", close: "" };
              return (
                <div key={dow} className="flex items-center gap-2">
                  <span className="w-24 text-sm">{formatDayLabel(dow)}</span>
                  <Input
                    type="time"
                    value={day.open}
                    onChange={(e) =>
                      setHours({ ...hours, [String(dow)]: { ...day, open: e.target.value } })
                    }
                    className="w-32"
                  />
                  <span className="text-muted-foreground">até</span>
                  <Input
                    type="time"
                    value={day.close}
                    onChange={(e) =>
                      setHours({ ...hours, [String(dow)]: { ...day, close: e.target.value } })
                    }
                    className="w-32"
                  />
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-card border border-border rounded-lg p-5 lg:col-span-2">
          <h2 className="text-xl mb-4">Contato e redes</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={settings.whatsapp_phone ?? ""}
                onChange={(e) => update("whatsapp_phone", e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={settings.instagram_url ?? ""}
                onChange={(e) => update("instagram_url", e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                value={settings.facebook_url ?? ""}
                onChange={(e) => update("facebook_url", e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
