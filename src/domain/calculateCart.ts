import type { CartItem, CartTotals, Listing, PromoStatus } from '../types/store';

type PromoRules = Readonly<Record<string, number>>;

export function resolvePromoStatus(promoCode: string, promoRules: PromoRules): PromoStatus {
  if (!promoCode) return 'none';

  return promoRules[promoCode] ? 'applied' : 'invalid';
}

export function calculateCartTotals(
  items: readonly CartItem[],
  listings: readonly Listing[],
  promoCode: string,
  promoRules: PromoRules,
): CartTotals {
  const subtotal = items.reduce((sum, line) => {
    const price = listings.find((listing) => listing.id === line.id)?.price ?? 0;

    return sum + price * line.quantity;
  }, 0);

  const promoStatus = resolvePromoStatus(promoCode, promoRules);
  const discountPercent = promoStatus === 'applied' ? (promoRules[promoCode] ?? 0) : 0;
  const discount = Math.round((subtotal * discountPercent) / 100);

  return {
    itemCount: items.reduce((sum, line) => sum + line.quantity, 0),
    subtotal,
    discountPercent,
    discount,
    total: subtotal - discount,
    promoStatus,
  };
}
