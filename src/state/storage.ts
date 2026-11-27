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

function extractCartId(entry: unknown): string | null {
  const candidate =
    typeof entry === 'object' && entry !== null ? (entry as Record<string, unknown>).id : entry;

  return typeof candidate === 'string' && candidate.trim().length > 0 ? candidate : null;
}

export function loadCart(storage: StorageLike | null = getDefaultStorage()): string[] {
  if (!storage) return [];

  try {
    const raw = storage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const ids = parsed.map(extractCartId).filter((id): id is string => id !== null);

    return Array.from(new Set(ids));
  } catch {
    return [];
  }
}

export function saveCart(
  ids: readonly string[],
  storage: StorageLike | null = getDefaultStorage(),
): void {
  if (!storage) return;

  try {
    storage.setItem(CART_STORAGE_KEY, JSON.stringify(ids));
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
