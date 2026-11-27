import { createDefaultFilters } from '../domain/filterListings';
import type { FilterState, PageId } from '../types/store';
import { getDefaultStorage, loadCart, loadPromoCode, saveCart, savePromoCode } from './storage';
import type { StorageLike } from './storage';

export interface AppState {
  currentPage: PageId;
  filters: FilterState;
  cart: readonly string[];
  promoCode: string;
}

export type StoreListener = (state: AppState) => void;

export function createStore(storage: StorageLike | null = getDefaultStorage()) {
  let currentPage: PageId = 'about';
  let filters: FilterState = createDefaultFilters();
  let cart: string[] = loadCart(storage);
  let promoCode = loadPromoCode(storage);

  const listeners = new Set<StoreListener>();

  function getState(): AppState {
    return {
      currentPage,
      filters: { ...filters },
      cart: [...cart],
      promoCode,
    };
  }

  function notify(): void {
    const snapshot = getState();
    for (const listener of listeners) {
      listener(snapshot);
    }
  }

  function subscribe(listener: StoreListener): () => void {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }

  function setPage(page: PageId): void {
    if (currentPage === page) return;

    currentPage = page;
    notify();
  }

  function setFilters(patch: Partial<FilterState>): void {
    filters = { ...filters, ...patch };
    notify();
  }

  function resetFilters(): void {
    filters = createDefaultFilters();
    notify();
  }

  function addToCart(id: string): void {
    if (!id.trim() || cart.includes(id)) return;

    cart = [...cart, id];

    saveCart(cart, storage);
    notify();
  }

  function removeFromCart(id: string): void {
    const nextCart = cart.filter((item) => item !== id);
    if (nextCart.length === cart.length) return;

    cart = nextCart;
    saveCart(cart, storage);
    notify();
  }

  function applyPromoCode(code: string): void {
    promoCode = code.trim().toUpperCase();
    savePromoCode(promoCode, storage);
    notify();
  }

  function clearPromoCode(): void {
    if (!promoCode) return;

    promoCode = '';
    savePromoCode('', storage);
    notify();
  }

  return {
    getState,
    subscribe,
    setPage,
    setFilters,
    resetFilters,
    addToCart,
    removeFromCart,
    applyPromoCode,
    clearPromoCode,
  };
}

export type AppStore = ReturnType<typeof createStore>;

export const store = createStore();
