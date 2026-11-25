import { describe, expect, it } from 'vitest';

import { PROMO_RULES } from '../data/promos';
import type { CartDetailItem, Listing, PromoRule } from '../types/store';
import {
  calculateCartTotals,
  calculateLineTotal,
  normalizePromoCode,
  toPromoRuleList,
} from './calculateCart';

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

describe('calculateCartTotals: граничные случаи', () => {
  it('округляет скидку до тетри: 10.05 * 10% = 1.005 -> 1.01', () => {
    const result = calculateCartTotals([makeItem(10.05, 1)], 'SALE10', rules);

    expect(result.discount).toBe(1.01);
    expect(result.total).toBe(9.04);
  });

  it('даёт точный итог на дробных суммах: 33.33 * 3 со скидкой 10%', () => {
    const result = calculateCartTotals([makeItem(33.33, 3)], 'SALE10', rules);

    expect(result.subtotal).toBe(99.99);
    expect(result.discount).toBe(10);
    expect(result.total).toBe(89.99);
  });

  it('считает правило с процентом вне 0-100 или NaN невалидным', () => {
    const broken: readonly PromoRule[] = [
      { code: 'OVER', discountPercent: 150 },
      { code: 'NEG', discountPercent: -20 },
      { code: 'BAD', discountPercent: Number.NaN },
    ];

    for (const code of ['OVER', 'NEG', 'BAD']) {
      const result = calculateCartTotals([makeItem(100, 1)], code, broken);

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

    expect(calculateCartTotals([makeItem(100, 1)], 'ZERO', edge).total).toBe(100);
    expect(calculateCartTotals([makeItem(100, 1)], 'FREE', edge).total).toBe(0);
  });

  it('не мутирует входные данные', () => {
    const items = Object.freeze([Object.freeze({ ...makeItem(10, 2) })]);
    const frozenRules = Object.freeze([Object.freeze({ code: 'SALE10', discountPercent: 10 })]);

    expect(() => calculateCartTotals(items, 'SALE10', frozenRules)).not.toThrow();
    expect(items[0]?.quantity).toBe(2);
  });
});

describe('calculateLineTotal: валидация входных данных', () => {
  it('возвращает 0 при нулевом количестве', () => {
    expect(calculateLineTotal(makeItem(100, 0))).toBe(0);
  });

  it('возвращает 0 при отрицательном количестве', () => {
    expect(calculateLineTotal(makeItem(100, -1))).toBe(0);
  });

  //возвращает 0 при дробном количестве

  it('возвращает 0 при NaN в количестве', () => {
    expect(calculateLineTotal(makeItem(100, Number.NaN))).toBe(0);
  });

  it('возвращает 0 при Infinity в количестве', () => {
    expect(calculateLineTotal(makeItem(100, Infinity))).toBe(0);
  });

  it('возвращает 0 при отрицательной цене', () => {
    expect(calculateLineTotal(makeItem(-100, 2))).toBe(0);
  });

  it('возвращает 0 при NaN в цене', () => {
    expect(calculateLineTotal(makeItem(Number.NaN, 2))).toBe(0);
  });

  it('возвращает 0 при Infinity в цене', () => {
    expect(calculateLineTotal(makeItem(Infinity, 2))).toBe(0);
  });

  it('допускает нулевую цену', () => {
    expect(calculateLineTotal(makeItem(0, 2))).toBe(0);
  });
});

describe('calculateCartTotals: валидация входных данных', () => {
  it('игнорирует невалидное количество при расчёте itemCount и subtotal', () => {
    const items = [
      makeItem(100, 2, 'A'),
      makeItem(200, 0, 'B'),
      makeItem(300, -1, 'C'),
      makeItem(400, 1.5, 'D'),
      makeItem(500, Number.NaN, 'E'),
    ];

    const result = calculateCartTotals(items, '', []);

    expect(result.itemCount).toBe(2);
    expect(result.subtotal).toBe(200);
    expect(result.discount).toBe(0);
    expect(result.total).toBe(200);
  });

  it('игнорирует невалидные цены, не ломая остальные позиции', () => {
    const items = [
      makeItem(100, 2, 'A'),
      makeItem(-50, 1, 'B'),
      makeItem(Number.NaN, 3, 'C'),
      makeItem(Infinity, 1, 'D'),
      makeItem(50, 2, 'E'),
    ];

    const result = calculateCartTotals(items, '', []);

    expect(result.itemCount).toBe(9);
    expect(result.subtotal).toBe(300);
    expect(result.total).toBe(300);
  });

  it('корректно рассчитывает скидку при наличии невалидных позиций', () => {
    const items = [makeItem(100, 2, 'A'), makeItem(Number.NaN, 1, 'B'), makeItem(-50, 1, 'C')];

    const result = calculateCartTotals(items, 'SALE10', rules);

    expect(result.itemCount).toBe(4);
    expect(result.subtotal).toBe(200);
    expect(result.discount).toBe(20);
    expect(result.total).toBe(180);
    expect(result.promoStatus).toBe('applied');
  });
});

describe('calculateCartTotals: округление денежных значений', () => {
  it('корректно округляет 1.005 до 1.01 в минимальных единицах', () => {
    expect(calculateLineTotal(makeItem(1.005, 1))).toBe(1.01);
  });

  it('корректно обрабатывает 0.1 + 0.2', () => {
    const price = 0.1 + 0.2;

    expect(calculateLineTotal(makeItem(price, 1))).toBe(0.3);
  });

  it('корректно рассчитывает сумму нескольких дробных позиций', () => {
    const items = [makeItem(0.1, 3, 'A'), makeItem(0.2, 2, 'B'), makeItem(1.005, 1, 'C')];

    const result = calculateCartTotals(items, '', []);

    expect(result.subtotal).toBe(1.71);
    expect(result.total).toBe(1.71);
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
    const result = calculateCartTotals([makeItem(100, 1)], 'agent10', toPromoRuleList(PROMO_RULES));

    expect(result.promoStatus).toBe('applied');
    expect(result.total).toBe(90);
  });
});
