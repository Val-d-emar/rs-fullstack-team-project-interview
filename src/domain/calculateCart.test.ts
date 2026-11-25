import { describe, expect, it } from 'vitest';

import type { CartDetailItem, Listing } from '../types/store';
import { calculateCartTotals, calculateLineTotal } from './calculateCart';

function makeListing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: 'T001',
    title: 'Тестовая квартира',
    district: 'Старый город',
    price: 40,
    area: 50,
    rooms: 2,
    floor: 3,
    totalFloors: 9,
    source: 'ss.ge',
    seller: 'Собственник',
    publishedAt: '2026-11-01',
    description: 'Описание',
    details: 'Подробности',
    features: [],
    images: [],
    contactHint: '+995 5•• ••• 000',
    ...overrides,
  };
}

function makeItem(price: number, quantity: number, id = 'T001'): CartDetailItem {
  return { listing: makeListing({ id, price }), quantity };
}

describe('calculateLineTotal', () => {
  it('умножает цену на количество', () => {
    expect(calculateLineTotal(makeItem(45, 3))).toBe(135);
  });

  it('не накапливает ошибку float: 0.1 * 3 = 0.3', () => {
    expect(calculateLineTotal(makeItem(0.1, 3))).toBe(0.3);
  });
});

describe('calculateCartTotals: суммы', () => {
  it('возвращает нули для пустой корзины', () => {
    expect(calculateCartTotals([], '', [])).toEqual({
      itemCount: 0,
      subtotal: 0,
      discountPercent: 0,
      discount: 0,
      total: 0,
      promoStatus: 'none',
    });
  });

  it('считает subtotal и itemCount для нескольких позиций с quantity > 1', () => {
    const items = [makeItem(45, 2, 'A'), makeItem(30, 3, 'B'), makeItem(25, 1, 'C')];

    const result = calculateCartTotals(items, '', []);

    expect(result.itemCount).toBe(6);
    expect(result.subtotal).toBe(205);
    expect(result.discount).toBe(0);
    expect(result.total).toBe(205);
    expect(result.promoStatus).toBe('none');
  });

  it('складывает дробные цены без накопления погрешности', () => {
    const items = [makeItem(19.99, 3, 'A'), makeItem(0.2, 1, 'B'), makeItem(0.1, 1, 'C')];

    expect(calculateCartTotals(items, '', []).subtotal).toBe(60.27);
  });
});
