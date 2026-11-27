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
    expect(() => saveCart(['BL001'], null)).not.toThrow();
    expect(() => savePromoCode('AGENT10', null)).not.toThrow();
  });

  it('возвращает пустую корзину при повреждённом JSON или данных не в виде массива', () => {
    const broken = createMemoryStorage({ [CART_STORAGE_KEY]: '{not-json' });
    const wrongType = createMemoryStorage({ [CART_STORAGE_KEY]: '{"id":"BL001"}' });

    expect(loadCart(broken)).toEqual([]);
    expect(loadCart(wrongType)).toEqual([]);
  });

  it('фильтрует недопустимые элементы и убирает дублирующиеся идентификаторы', () => {
    const raw = JSON.stringify(['BL001', 'BL001', 'BL002', '', '   ', 123, null, { id: 5 }]);
    const storage = createMemoryStorage({ [CART_STORAGE_KEY]: raw });

    expect(loadCart(storage)).toEqual(['BL001', 'BL002']);
  });

  it('мигрирует старый формат { id, quantity }: количество отбрасывается', () => {
    const raw = JSON.stringify([
      { id: 'BL001', quantity: 3 },
      { id: 'BL001', quantity: 1 },
      { id: 'BL002', quantity: 1 },
      { id: '', quantity: 2 },
    ]);
    const storage = createMemoryStorage({ [CART_STORAGE_KEY]: raw });

    expect(loadCart(storage)).toEqual(['BL001', 'BL002']);
  });

  it('сохраняет и загружает корзину как список id', () => {
    const storage = createMemoryStorage();

    saveCart(['BL001', 'BL002'], storage);

    expect(storage.getItem(CART_STORAGE_KEY)).toBe('["BL001","BL002"]');
    expect(loadCart(storage)).toEqual(['BL001', 'BL002']);
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
    expect(() => saveCart(['BL001'], failingStorage)).not.toThrow();
    expect(() => savePromoCode('SALE10', failingStorage)).not.toThrow();
  });
});
