import { describe, expect, it, vi } from 'vitest';

import { ALL_DISTRICTS } from '../types/store';
import { createStore } from './store';
import type { StorageLike } from './storage';

function createMemoryStorage(): StorageLike {
  const map = new Map<string, string>();

  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
  };
}

describe('createStore', () => {
  it('начинается на странице «О сайте» с пустой корзиной и стандартными фильтрами', () => {
    const appStore = createStore(createMemoryStorage());
    const state = appStore.getState();

    expect(state.currentPage).toBe('about');
    expect(state.cart).toEqual([]);
    expect(state.promoCode).toBe('');
    expect(state.filters).toEqual({
      search: '',
      district: ALL_DISTRICTS,
      minPrice: null,
      maxPrice: null,
      sort: 'default',
    });
  });

  it('сохраняет корзину и промокод между экземплярами магазина без сохранения currentPage', () => {
    const storage = createMemoryStorage();
    const first = createStore(storage);

    first.setPage('cart');
    first.addToCart('BL001');
    first.addToCart('BL002');
    first.applyPromoCode(' sale10 ');

    const restored = createStore(storage);
    const state = restored.getState();

    expect(state.currentPage).toBe('about');
    expect(state.cart).toEqual(['BL001', 'BL002']);
    expect(state.promoCode).toBe('SALE10');
  });

  it('не добавляет один и тот же лид дважды и не уведомляет подписчиков о дубликате', () => {
    const appStore = createStore(createMemoryStorage());
    const listener = vi.fn();

    appStore.addToCart('BL001');
    appStore.subscribe(listener);
    appStore.addToCart('BL001');

    expect(appStore.getState().cart).toEqual(['BL001']);
    expect(listener).not.toHaveBeenCalled();
  });

  it('игнорирует пустой id', () => {
    const appStore = createStore(createMemoryStorage());

    appStore.addToCart('   ');
    expect(appStore.getState().cart).toEqual([]);
  });

  it('удаляет элементы из корзины', () => {
    const appStore = createStore(createMemoryStorage());

    appStore.addToCart('BL001');
    appStore.addToCart('BL002');
    appStore.removeFromCart('BL001');
    expect(appStore.getState().cart).toEqual(['BL002']);

    appStore.removeFromCart('BL002');
    expect(appStore.getState().cart).toEqual([]);
  });

  it('обновляет и сбрасывает фильтры и промокод', () => {
    const appStore = createStore(createMemoryStorage());

    appStore.setFilters({ search: 'море', district: 'Новый бульвар', minPrice: 30 });
    expect(appStore.getState().filters.search).toBe('море');

    appStore.resetFilters();
    expect(appStore.getState().filters.search).toBe('');
    expect(appStore.getState().filters.district).toBe(ALL_DISTRICTS);

    appStore.applyPromoCode('AGENT10');
    appStore.clearPromoCode();
    expect(appStore.getState().promoCode).toBe('');
  });

  it('уведомляет подписчиков и поддерживает отписку', () => {
    const appStore = createStore(createMemoryStorage());
    const listener = vi.fn();

    const unsubscribe = appStore.subscribe(listener);
    appStore.addToCart('BL001');
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    appStore.addToCart('BL002');
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
