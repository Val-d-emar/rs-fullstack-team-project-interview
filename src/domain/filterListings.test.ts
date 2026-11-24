import { describe, expect, it } from 'vitest';

import { ALL_DISTRICTS } from '../types/store';
import type { FilterState, Listing } from '../types/store';
import { createDefaultFilters, filterAndSortListings, hasActiveFilters } from './filterListings';

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

function makeFilters(overrides: Partial<FilterState> = {}): FilterState {
  return { ...createDefaultFilters(), ...overrides };
}

const cheap = makeListing({
  id: 'A',
  title: 'Лофт',
  district: 'Старый город',
  price: 20,
  area: 30,
});
const middle = makeListing({ id: 'B', title: 'Студия', district: 'Аэропорт', price: 40, area: 60 });
const pricey = makeListing({
  id: 'C',
  title: 'Пентхаус',
  district: 'Старый город',
  price: 90,
  area: 120,
});
const all = [cheap, middle, pricey];

const ids = (items: Listing[]): string[] => items.map((item) => item.id);

describe('filterAndSortListings', () => {
  it('возвращает все объявления с настройками фильтров по умолчанию', () => {
    expect(ids(filterAndSortListings(all, makeFilters()))).toEqual(['A', 'B', 'C']);
  });

  it('не изменяет исходный массив', () => {
    const source = [pricey, cheap];

    filterAndSortListings(source, makeFilters({ sort: 'price-asc' }));

    expect(ids(source)).toEqual(['C', 'A']);
  });

  describe('search', () => {
    it('игнорирует регистр букв', () => {
      expect(ids(filterAndSortListings(all, makeFilters({ search: 'ЛОФТ' })))).toEqual(['A']);
    });

    it('удаляет пробелы вокруг', () => {
      expect(ids(filterAndSortListings(all, makeFilters({ search: '  студия ' })))).toEqual(['B']);
    });

    it('также ищет по району и идентификатору', () => {
      expect(ids(filterAndSortListings(all, makeFilters({ search: 'аэропорт' })))).toEqual(['B']);
      expect(ids(filterAndSortListings(all, makeFilters({ search: 'c' })))).toContain('C');
    });

    it('возвращает пустой список, когда ничего не совпадает', () => {
      expect(filterAndSortListings(all, makeFilters({ search: 'нет такого' }))).toEqual([]);
    });
  });

  describe('district', () => {
    it('сохраняет только объявления из выбранного района', () => {
      const result = filterAndSortListings(all, makeFilters({ district: 'Старый город' }));

      expect(ids(result)).toEqual(['A', 'C']);
    });

    it('показывает всё для значения «все районы»', () => {
      const result = filterAndSortListings(all, makeFilters({ district: ALL_DISTRICTS }));

      expect(result).toHaveLength(3);
    });
  });

  describe('ценовой диапазон', () => {
    it('включает граничные значения', () => {
      const result = filterAndSortListings(all, makeFilters({ minPrice: 20, maxPrice: 40 }));

      expect(ids(result)).toEqual(['A', 'B']);
    });

    it('поддерживает только нижнюю границу', () => {
      expect(ids(filterAndSortListings(all, makeFilters({ minPrice: 41 })))).toEqual(['C']);
    });

    it('поддерживает только верхнюю границу', () => {
      expect(ids(filterAndSortListings(all, makeFilters({ maxPrice: 19 })))).toEqual([]);
    });

    it('рассматривает нулевую нижнюю границу как реальное ограничение, а не как "empty"', () => {
      expect(filterAndSortListings(all, makeFilters({ minPrice: 0, maxPrice: 0 }))).toEqual([]);
    });
  });

  describe('сортировка', () => {
    it('сортирует по возрастанию цены', () => {
      const result = filterAndSortListings(
        [pricey, cheap, middle],
        makeFilters({ sort: 'price-asc' }),
      );

      expect(ids(result)).toEqual(['A', 'B', 'C']);
    });

    it('сортирует по цене по убыванию', () => {
      const result = filterAndSortListings(all, makeFilters({ sort: 'price-desc' }));

      expect(ids(result)).toEqual(['C', 'B', 'A']);
    });

    it('сортировать по площади по убыванию', () => {
      const result = filterAndSortListings(all, makeFilters({ sort: 'area-desc' }));

      expect(ids(result)).toEqual(['C', 'B', 'A']);
    });
  });

  it('объединяет несколько фильтров', () => {
    const result = filterAndSortListings(
      all,
      makeFilters({ district: 'Старый город', maxPrice: 50, sort: 'price-desc' }),
    );

    expect(ids(result)).toEqual(['A']);
  });
});

describe('hasActiveFilters', () => {
  it('false для фильтров по умолчанию', () => {
    expect(hasActiveFilters(createDefaultFilters())).toBe(false);
  });

  it('игнорирует поиск, состоящий только из пробелов', () => {
    expect(hasActiveFilters(makeFilters({ search: '   ' }))).toBe(false);
  });

  it('true, когда любой фильтр изменен', () => {
    expect(hasActiveFilters(makeFilters({ district: 'Аэропорт' }))).toBe(true);
    expect(hasActiveFilters(makeFilters({ minPrice: 0 }))).toBe(true);
    expect(hasActiveFilters(makeFilters({ sort: 'price-asc' }))).toBe(true);
  });

  it('игнорирует границы цены NaN', () => {
    expect(ids(filterAndSortListings(all, makeFilters({ minPrice: Number.NaN })))).toEqual([
      'A',
      'B',
      'C',
    ]);
  });

  it('возвращает пустой список, когда minPrice больше maxPrice', () => {
    expect(filterAndSortListings(all, makeFilters({ minPrice: 60, maxPrice: 30 }))).toEqual([]);
  });
});
