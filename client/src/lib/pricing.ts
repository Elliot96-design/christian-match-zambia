export const ZMW_PER_USD = 25;
export const CHAT_UNLOCK_ZMW = 35;
export const PREMIUM_FIRST_MONTH_ZMW = 75;
export const PREMIUM_MONTHLY_ZMW = 120;

/** The existing profile location is free-form; Zambia remains the safe default for legacy local profiles. */
export function isZambiaLocation(location?: string | null): boolean {
  return !location || /\bzambia\b/i.test(location);
}

export function formatPrice(zmw: number, location?: string | null): string {
  if (isZambiaLocation(location)) return `K${zmw}`;
  return `$${(zmw / ZMW_PER_USD).toFixed(2)}`;
}
