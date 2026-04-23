/**
 * GET /api/v1/bookings returns { bookings: [...] } (not a raw array).
 */
export function getBookingsArray(res) {
  const d = res?.data;
  if (Array.isArray(d?.bookings)) return d.bookings;
  if (Array.isArray(d)) return d;
  return [];
}
