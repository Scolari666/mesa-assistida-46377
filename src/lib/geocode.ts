export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

interface AddressQuery {
  street: string;
  number: string;
  neighborhood?: string;
  city: string;
  state: string;
}

/**
 * Geocodes a Brazilian street address using OpenStreetMap's Nominatim (free,
 * no API key). Used client-side just to attach lat/lng to the delivery
 * address; the server independently recomputes the distance/fee from those
 * coordinates, so a bad or unavailable geocode never lets the client dictate
 * pricing.
 */
export async function geocodeAddress(address: AddressQuery): Promise<GeocodeResult | null> {
  const query = [
    `${address.street}, ${address.number}`,
    address.neighborhood,
    address.city,
    address.state,
    "Brasil",
  ]
    .filter(Boolean)
    .join(", ");

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;

    const results: Array<{ lat: string; lon: string; display_name: string }> = await response.json();
    if (!results.length) return null;

    return {
      lat: parseFloat(results[0].lat),
      lng: parseFloat(results[0].lon),
      displayName: results[0].display_name,
    };
  } catch {
    return null;
  }
}
