import type { CartDetailItem, CartTotals, PromoRule, PromoStatus } from '../types/store';

const MINOR_UNITS_PER_MAJOR = 100;

const toMinor = (value: number): number => Math.round(value * MINOR_UNITS_PER_MAJOR);
const fromMinor = (value: number): number => value / MINOR_UNITS_PER_MAJOR;

export function normalizePromoCode(code: string): string {
  return code.trim().toUpperCase();
}

function calculateLineMinor(item: CartDetailItem): number {
  return toMinor(item.listing.price) * item.quantity;
}

export function calculateLineTotal(item: CartDetailItem): number {
  return fromMinor(calculateLineMinor(item));
}

export function calculateCartTotals(
  items: readonly CartDetailItem[],
  promoCode: string,
  promoRules: readonly PromoRule[],
): CartTotals {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalMinor = items.reduce((sum, item) => sum + calculateLineMinor(item), 0);

  const code = normalizePromoCode(promoCode);
  const rule =
    code === ''
      ? undefined
      : promoRules.find((candidate) => normalizePromoCode(candidate.code) === code);

  const promoStatus: PromoStatus = code === '' ? 'none' : rule ? 'applied' : 'invalid';
  const discountPercent = rule?.discountPercent ?? 0;
  const discountMinor = Math.round((subtotalMinor * discountPercent) / 100);

  return {
    itemCount,
    subtotal: fromMinor(subtotalMinor),
    discountPercent,
    discount: fromMinor(discountMinor),
    total: fromMinor(subtotalMinor - discountMinor),
    promoStatus,
  };
}
