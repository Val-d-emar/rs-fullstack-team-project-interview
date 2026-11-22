import { describe, expect, it } from 'vitest';

import type { CartItem, Listing } from '../types/store';
import { calculateCartTotals, resolvePromoStatus } from '../domain/calculateCart';

const PROMO_RULES = { AGENT10: 10, HALF: 50 };

function makeListing(id: string, price: number): Listing {
  return {
    id,
    title: `Объект ${id}`,
    district: 'Старый город',
    price,
    area: 50,
    rooms: 2,
    floor: 1,
    totalFloors: 5,
    source: 'ss.ge',
    seller: 'Собственник',
    publishedAt: '2026-11-01',
    description: '',
    details: '',
    features: [],
    images: [],
    contactHint: '',
  };
}

const listings = [makeListing('A', 45), makeListing('B', 25)];

describe('resolvePromoStatus', () => {
  it('returns "none" for an empty code', () => {
    expect(resolvePromoStatus('', PROMO_RULES)).toBe('none');
  });

  it('returns "applied" for a known code', () => {
    expect(resolvePromoStatus('AGENT10', PROMO_RULES)).toBe('applied');
  });

  it('returns "invalid" for an unknown code', () => {
    expect(resolvePromoStatus('WRONG', PROMO_RULES)).toBe('invalid');
  });
});

describe('calculateCartTotals', () => {
  it('returns zeros for an empty cart', () => {
    const totals = calculateCartTotals([], listings, '', PROMO_RULES);

    expect(totals).toEqual({
      itemCount: 0,
      subtotal: 0,
      discountPercent: 0,
      discount: 0,
      total: 0,
      promoStatus: 'none',
    });
  });

  it('multiplies price by quantity and sums the lines', () => {
    const items: CartItem[] = [
      { id: 'A', quantity: 2 },
      { id: 'B', quantity: 1 },
    ];
    const totals = calculateCartTotals(items, listings, '', PROMO_RULES);

    expect(totals.subtotal).toBe(115);
    expect(totals.itemCount).toBe(3);
    expect(totals.total).toBe(115);
  });

  it('applies a valid promo code', () => {
    const totals = calculateCartTotals(
      [{ id: 'A', quantity: 2 }],
      listings,
      'AGENT10',
      PROMO_RULES,
    );

    expect(totals.promoStatus).toBe('applied');
    expect(totals.discountPercent).toBe(10);
    expect(totals.discount).toBe(9);
    expect(totals.total).toBe(81);
  });

  it('does not discount anything for an invalid promo code', () => {
    const totals = calculateCartTotals([{ id: 'A', quantity: 1 }], listings, 'WRONG', PROMO_RULES);

    expect(totals.promoStatus).toBe('invalid');
    expect(totals.discount).toBe(0);
    expect(totals.total).toBe(45);
  });

  it('rounds the discount to a whole number', () => {
    // 25 * 10% = 2.5 → 3
    const totals = calculateCartTotals(
      [{ id: 'B', quantity: 1 }],
      listings,
      'AGENT10',
      PROMO_RULES,
    );

    expect(totals.discount).toBe(3);
    expect(totals.total).toBe(22);
  });

  it('ignores cart lines whose listing no longer exists', () => {
    const items: CartItem[] = [
      { id: 'A', quantity: 1 },
      { id: 'MISSING', quantity: 5 },
    ];
    const totals = calculateCartTotals(items, listings, '', PROMO_RULES);

    expect(totals.subtotal).toBe(45);
  });
});
