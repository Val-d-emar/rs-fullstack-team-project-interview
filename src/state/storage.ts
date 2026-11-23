import type { CartItem } from '../types/store';

export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

export const CART_STORAGE_KEY = 'batumi-leads:cart';
export const PROMO_STORAGE_KEY = 'batumi-leads:promo';

export function getDefaultStorage(): StorageLike | null {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isValidCartItem(value: unknown): value is CartItem {
  if (typeof value !== 'object' || value === null) return false;

  const record = value as Record<string, unknown>;

  return (
    typeof record.id === 'string' &&
    record.id.trim().length > 0 &&
    typeof record.quantity === 'number' &&
    Number.isInteger(record.quantity) &&
    record.quantity >= 1
  );
}

export function loadCart(storage: StorageLike | null = getDefaultStorage()): CartItem[] {
  if (!storage) return [];

  try {
    const raw = storage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Объединяем возможные дубликаты id, если данные в хранилище редактировались вручную
    const merged = new Map<string, number>();

    for (const entry of parsed) {
      if (isValidCartItem(entry)) {
        merged.set(entry.id, (merged.get(entry.id) ?? 0) + entry.quantity);
      }
    }

    return Array.from(merged, ([id, quantity]) => ({ id, quantity }));
  } catch {
    return [];
  }
}

export function saveCart(
  items: readonly CartItem[],
  storage: StorageLike | null = getDefaultStorage(),
): void {
  if (!storage) return;

  try {
    storage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Игнорируем переполнение квоты или запрет записи в приватном режиме
  }
}

export function loadPromoCode(storage: StorageLike | null = getDefaultStorage()): string {
  if (!storage) return '';

  try {
    const raw = storage.getItem(PROMO_STORAGE_KEY);
    return typeof raw === 'string' ? raw.trim().toUpperCase() : '';
  } catch {
    return '';
  }
}

export function savePromoCode(
  promoCode: string,
  storage: StorageLike | null = getDefaultStorage(),
): void {
  if (!storage) return;

  try {
    storage.setItem(PROMO_STORAGE_KEY, promoCode.trim().toUpperCase());
  } catch {
    // Игнорируем переполнение квоты или запрет записи в приватном режиме
  }
}
