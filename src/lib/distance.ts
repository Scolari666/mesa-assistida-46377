/**
 * Haversine distance in km. Used only to preview the delivery fee while the
 * customer fills the address — create_order() recomputes it server-side from
 * the store coordinates and the per-km rate, and that result is authoritative.
 */
export function distanceKm(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;

  return earthRadiusKm * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}
