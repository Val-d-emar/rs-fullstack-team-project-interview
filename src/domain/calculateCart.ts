import type { CartDetailItem, CartTotals, PromoRule } from '../types/store';

const MINOR_UNITS_PER_MAJOR = 100;

const toMinor = (value: number): number => Math.round(value * MINOR_UNITS_PER_MAJOR);
const fromMinor = (value: number): number => value / MINOR_UNITS_PER_MAJOR;

function calculateLineMinor(item: CartDetailItem): number {
  return toMinor(item.listing.price) * item.quantity;
}

export function calculateLineTotal(item: CartDetailItem): number {
  return fromMinor(calculateLineMinor(item));
}

export function calculateCartTotals(
  items: readonly CartDetailItem[],
  _promoCode: string,
  _promoRules: readonly PromoRule[],
): CartTotals {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalMinor = items.reduce((sum, item) => sum + calculateLineMinor(item), 0);

  return {
    itemCount,
    subtotal: fromMinor(subtotalMinor),
    discountPercent: 0,
    discount: 0,
    total: fromMinor(subtotalMinor),
    promoStatus: 'none',
  };
}
