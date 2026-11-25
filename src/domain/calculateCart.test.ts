import { describe, expect, it } from 'vitest';

import type { CartDetailItem, Listing, PromoRule } from '../types/store';
import { calculateCartTotals, calculateLineTotal, normalizePromoCode } from './calculateCart';

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

const rules: readonly PromoRule[] = [
  { code: 'SALE10', discountPercent: 10 },
  { code: 'HALF', discountPercent: 50 },
];

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

describe('calculateCartTotals: промокод', () => {
  const items = [makeItem(50, 2, 'A'), makeItem(100, 1, 'B')]; // subtotal = 200

  it('применяет валидный промокод', () => {
    expect(calculateCartTotals(items, 'SALE10', rules)).toEqual({
      itemCount: 3,
      subtotal: 200,
      discountPercent: 10,
      discount: 20,
      total: 180,
      promoStatus: 'applied',
    });
  });

  it('игнорирует регистр и пробелы по краям', () => {
    const result = calculateCartTotals(items, '  sale10 ', rules);

    expect(result.promoStatus).toBe('applied');
    expect(result.total).toBe(180);
  });

  it('помечает неизвестный промокод как invalid и не даёт скидку', () => {
    const result = calculateCartTotals(items, 'UNKNOWN', rules);

    expect(result.promoStatus).toBe('invalid');
    expect(result.discount).toBe(0);
    expect(result.total).toBe(200);
  });

  it('считает пустую строку и пробелы отсутствием промокода', () => {
    expect(calculateCartTotals(items, '', rules).promoStatus).toBe('none');
    expect(calculateCartTotals(items, '   ', rules).promoStatus).toBe('none');
  });

  it('не накапливается при повторном применении', () => {
    const first = calculateCartTotals(items, 'SALE10', rules);

    expect(calculateCartTotals(items, 'SALE10', rules)).toEqual(first);
    expect(calculateCartTotals(items, 'sale10', rules)).toEqual(first);
    expect(first.total).toBe(180);
  });

  it('считает скидку от subtotal, а не от сниженной суммы', () => {
    const result = calculateCartTotals(items, 'HALF', rules);

    expect(result.discount).toBe(100);
    expect(result.total).toBe(100);
  });

  it('на пустой корзине даёт нулевую скидку даже с валидным промокодом', () => {
    const result = calculateCartTotals([], 'SALE10', rules);

    expect(result.subtotal).toBe(0);
    expect(result.discount).toBe(0);
    expect(result.total).toBe(0);
    expect(result.promoStatus).toBe('applied');
  });
});

describe('normalizePromoCode', () => {
  it('обрезает пробелы и приводит к верхнему регистру', () => {
    expect(normalizePromoCode('  sale10 ')).toBe('SALE10');
  });
});
