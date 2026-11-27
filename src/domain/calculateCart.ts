import type { CartTotals, Listing, PromoRule, PromoRules, PromoStatus } from '../types/store';

const MINOR_UNITS_PER_MAJOR = 100;

const toMinor = (value: number): number => {
  const scaledValue = value * MINOR_UNITS_PER_MAJOR;
  const epsilon = Number.EPSILON * Math.abs(scaledValue);

  return Math.round(scaledValue + epsilon);
};

const fromMinor = (value: number): number => value / MINOR_UNITS_PER_MAJOR;

export function normalizePromoCode(code: string): string {
  return code.trim().toUpperCase();
}

function isValidRule(rule: PromoRule): boolean {
  return (
    Number.isFinite(rule.discountPercent) &&
    rule.discountPercent >= 0 &&
    rule.discountPercent <= 100
  );
}

export function toPromoRuleList(rules: PromoRules): PromoRule[] {
  return Object.entries(rules).map(([code, discountPercent]) => ({
    code,
    discountPercent,
  }));
}

function isValidPrice(price: number): boolean {
  return Number.isFinite(price) && price >= 0;
}

export function calculateCartTotals(
  items: readonly Listing[],
  promoCode: string,
  promoRules: readonly PromoRule[],
): CartTotals {
  const validItems = items.filter((item) => isValidPrice(item.price));
  const itemCount = validItems.length;
  const subtotalMinor = validItems.reduce((sum, item) => sum + toMinor(item.price), 0);
  const code = normalizePromoCode(promoCode);

  const rule =
    code === ''
      ? undefined
      : promoRules.find(
          (candidate) => isValidRule(candidate) && normalizePromoCode(candidate.code) === code,
        );

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
