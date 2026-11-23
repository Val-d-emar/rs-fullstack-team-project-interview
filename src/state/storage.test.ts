import { describe, expect, it } from 'vitest';

import {
  CART_STORAGE_KEY,
  PROMO_STORAGE_KEY,
  loadCart,
  loadPromoCode,
  saveCart,
  savePromoCode,
} from './storage';
import type { StorageLike } from './storage';

function createMemoryStorage(initial: Record<string, string> = {}): StorageLike {
  const map = new Map(Object.entries(initial));

  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
  };
}

describe('storage adapter', () => {
  it('возвращает пустые значения, когда хранилище равно null', () => {
    expect(loadCart(null)).toEqual([]);
    expect(loadPromoCode(null)).toBe('');
    expect(() => saveCart([{ id: 'BL001', quantity: 1 }], null)).not.toThrow();
    expect(() => savePromoCode('AGENT10', null)).not.toThrow();
  });

  it('возвращает пустую корзину при повреждённом JSON или данных не в виде массива', () => {
    const broken = createMemoryStorage({ [CART_STORAGE_KEY]: '{not-json' });
    const wrongType = createMemoryStorage({ [CART_STORAGE_KEY]: '{"id":"BL001"}' });

    expect(loadCart(broken)).toEqual([]);
    expect(loadCart(wrongType)).toEqual([]);
  });

  it('фильтрует недопустимые элементы и объединяет дублирующиеся идентификаторы', () => {
    const raw = JSON.stringify([
      { id: 'BL001', quantity: 2 },
      { id: 'BL001', quantity: 1 },
      { id: 'BL002', quantity: 0 },
      { id: 'BL003', quantity: 1.5 },
      { id: '', quantity: 2 },
      { id: 123, quantity: 1 },
      null,
    ]);
    const storage = createMemoryStorage({ [CART_STORAGE_KEY]: raw });

    expect(loadCart(storage)).toEqual([{ id: 'BL001', quantity: 3 }]);
  });

  it('нормализует промо-код при загрузке и сохранении', () => {
    const storage = createMemoryStorage();

    savePromoCode('  agent10 ', storage);
    expect(storage.getItem(PROMO_STORAGE_KEY)).toBe('AGENT10');
    expect(loadPromoCode(storage)).toBe('AGENT10');
  });

  it('не выбрасывает исключений, когда методы хранения вызывают ошибки', () => {
    const failingStorage: StorageLike = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };

    expect(loadCart(failingStorage)).toEqual([]);
    expect(loadPromoCode(failingStorage)).toBe('');
    expect(() => saveCart([{ id: 'BL001', quantity: 1 }], failingStorage)).not.toThrow();
    expect(() => savePromoCode('SALE10', failingStorage)).not.toThrow();
  });
});
