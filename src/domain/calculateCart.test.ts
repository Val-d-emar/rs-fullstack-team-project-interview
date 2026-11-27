import { describe, expect, it } from 'vitest';

import { PROMO_RULES } from '../data/promos';
import type { Listing, PromoRule } from '../types/store';
import { calculateCartTotals, normalizePromoCode, toPromoRuleList } from './calculateCart';

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

function makeItem(price: number, id = 'T001'): Listing {
  return makeListing({ id, price });
}

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

  it('считает subtotal и itemCount: один доступ на каждый лид', () => {
    const items = [makeItem(45, 'A'), makeItem(30, 'B'), makeItem(25, 'C')];

    const result = calculateCartTotals(items, '', []);

    expect(result.itemCount).toBe(3);
    expect(result.subtotal).toBe(100);
    expect(result.discount).toBe(0);
    expect(result.total).toBe(100);
    expect(result.promoStatus).toBe('none');
  });

  it('складывает дробные цены без накопления погрешности', () => {
    const items = [makeItem(19.99, 'A'), makeItem(0.2, 'B'), makeItem(0.1, 'C')];

    expect(calculateCartTotals(items, '', []).subtotal).toBe(20.29);
  });

  it('не накапливает ошибку float: 0.1 + 0.2 = 0.3', () => {
    const items = [makeItem(0.1, 'A'), makeItem(0.2, 'B')];

    expect(calculateCartTotals(items, '', []).subtotal).toBe(0.3);
  });
});

describe('calculateCartTotals: промокод', () => {
  const items = [makeItem(100, 'A'), makeItem(100, 'B')];

  it('применяет валидный промокод', () => {
    expect(calculateCartTotals(items, 'SALE10', rules)).toEqual({
      itemCount: 2,
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

describe('calculateCartTotals: граничные случаи', () => {
  it('округляет скидку до тетри: 10.05 * 10% = 1.005 -> 1.01', () => {
    const result = calculateCartTotals([makeItem(10.05)], 'SALE10', rules);

    expect(result.discount).toBe(1.01);
    expect(result.total).toBe(9.04);
  });

  it('даёт точный итог на дробных суммах: 33.33 × 3 лида со скидкой 10%', () => {
    const items = [makeItem(33.33, 'A'), makeItem(33.33, 'B'), makeItem(33.33, 'C')];
    const result = calculateCartTotals(items, 'SALE10', rules);

    expect(result.subtotal).toBe(99.99);
    expect(result.discount).toBe(10);
    expect(result.total).toBe(89.99);
  });

  it('округляет цены до тетри: 1.005 → 1.01, 2.675 → 2.68', () => {
    expect(calculateCartTotals([makeItem(1.005)], '', []).subtotal).toBe(1.01);
    expect(calculateCartTotals([makeItem(2.675)], '', []).subtotal).toBe(2.68);
  });

  it('считает правило с процентом вне 0-100 или NaN невалидным', () => {
    const broken: readonly PromoRule[] = [
      { code: 'OVER', discountPercent: 150 },
      { code: 'NEG', discountPercent: -20 },
      { code: 'BAD', discountPercent: Number.NaN },
    ];

    for (const code of ['OVER', 'NEG', 'BAD']) {
      const result = calculateCartTotals([makeItem(100)], code, broken);

      expect(result.promoStatus).toBe('invalid');
      expect(result.discount).toBe(0);
      expect(result.total).toBe(100);
    }
  });

  it('допускает граничные проценты 0 и 100', () => {
    const edge: readonly PromoRule[] = [
      { code: 'ZERO', discountPercent: 0 },
      { code: 'FREE', discountPercent: 100 },
    ];

    expect(calculateCartTotals([makeItem(100)], 'ZERO', edge).total).toBe(100);
    expect(calculateCartTotals([makeItem(100)], 'FREE', edge).total).toBe(0);
  });

  it('не мутирует входные данные', () => {
    const items = Object.freeze([Object.freeze({ ...makeItem(10) })]);
    const frozenRules = Object.freeze([Object.freeze({ code: 'SALE10', discountPercent: 10 })]);

    expect(() => calculateCartTotals(items, 'SALE10', frozenRules)).not.toThrow();
    expect(items[0]?.price).toBe(10);
  });
});

describe('calculateCartTotals: валидация входных данных', () => {
  it('игнорирует невалидные цены при расчёте itemCount и subtotal', () => {
    const items = [
      makeItem(100, 'A'),
      makeItem(-50, 'B'),
      makeItem(Number.NaN, 'C'),
      makeItem(Infinity, 'D'),
      makeItem(50, 'E'),
    ];

    const result = calculateCartTotals(items, '', []);

    expect(result.itemCount).toBe(2);
    expect(result.subtotal).toBe(150);
    expect(result.total).toBe(150);
  });

  it('корректно рассчитывает скидку при наличии невалидных позиций', () => {
    const items = [makeItem(200, 'A'), makeItem(Number.NaN, 'B'), makeItem(-50, 'C')];

    const result = calculateCartTotals(items, 'SALE10', rules);

    expect(result.itemCount).toBe(1);
    expect(result.subtotal).toBe(200);
    expect(result.discount).toBe(20);
    expect(result.total).toBe(180);
    expect(result.promoStatus).toBe('applied');
  });

  it('допускает нулевую цену', () => {
    const result = calculateCartTotals([makeItem(0)], '', []);

    expect(result.itemCount).toBe(1);
    expect(result.total).toBe(0);
  });
});

describe('toPromoRuleList', () => {
  it('превращает PROMO_RULES в список правил', () => {
    expect(toPromoRuleList({ SALE10: 10, HALF: 50 })).toEqual([
      { code: 'SALE10', discountPercent: 10 },
      { code: 'HALF', discountPercent: 50 },
    ]);
  });

  it('работает с реальными промокодами проекта', () => {
    const result = calculateCartTotals([makeItem(100)], 'agent10', toPromoRuleList(PROMO_RULES));

    expect(result.promoStatus).toBe('applied');
    expect(result.total).toBe(90);
  });
});
