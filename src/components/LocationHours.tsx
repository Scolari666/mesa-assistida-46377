import { MapPin, Clock, Phone } from "lucide-react";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { formatHoursSummary, isStoreOpen, type BusinessHours } from "@/lib/businessHours";

export const LocationHours = () => {
  const { settings } = useStoreSettings();

  const address = settings
    ? `${settings.address_street}, ${settings.address_number} - ${settings.address_city}, ${settings.address_state}`
    : "Rua Serafim Valandro, 605 - Santa Maria, RS";

  const hours = (settings?.business_hours as unknown as BusinessHours) ?? null;
  const open = hours ? isStoreOpen(hours) : null;
  const mapQuery = encodeURIComponent(`${address}, ${settings?.address_zip ?? "97010-480"}`);

  return (
    <section id="local" className="py-20 md:py-28 bg-card">
      <div className="container px-4 md:px-6">
        <div className="mb-12 text-center">
          <span className="font-hand text-primary text-2xl">Bora chegar</span>
          <h2 className="text-4xl md:text-5xl">Horário &amp; Localização</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          <div className="rounded-lg overflow-hidden border border-border h-80 md:h-auto">
            <iframe
              title="Mapa Porks Santa Maria"
              className="w-full h-full grayscale-[40%] contrast-125"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://maps.google.com/maps?q=${mapQuery}&output=embed`}
            />
          </div>

          <div className="bg-background border border-border rounded-lg p-8 flex flex-col justify-center">
            <div className="flex items-start gap-4 mb-6">
              <MapPin className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-display text-xl tracking-wide">Endereço</h3>
                <p className="text-muted-foreground">
                  {address}
                  {settings?.address_zip ? `, ${settings.address_zip}` : ""}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 mb-6">
              <Clock className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-display text-xl tracking-wide">Horário</h3>
                  {open !== null && (
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        open ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {open ? "Aberto agora" : "Fechado agora"}
                    </span>
                  )}
                </div>
                <ul className="text-muted-foreground text-sm space-y-0.5">
                  {hours
                    ? formatHoursSummary(hours).map((h) => (
                        <li key={h.day} className="flex justify-between gap-4">
                          <span>{h.day}</span>
                          <span>{h.range}</span>
                        </li>
                      ))
                    : (
                        <>
                          <li>Seg-Qui: 17h30 - 00h</li>
                          <li>Sex: 17h30 - 1h</li>
                          <li>Sáb: 17h - 1h</li>
                          <li>Dom: 17h - 23h30</li>
                        </>
                      )}
                </ul>
              </div>
            </div>

            {settings?.whatsapp_phone && (
              <div className="flex items-start gap-4">
                <Phone className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-display text-xl tracking-wide">WhatsApp</h3>
                  <p className="text-muted-foreground">{settings.whatsapp_phone}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
