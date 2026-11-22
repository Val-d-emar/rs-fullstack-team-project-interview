import { describe, expect, it } from 'vitest';

import { ALL_DISTRICTS } from '../types/store';
import type { FilterState, Listing } from '../types/store';
import {
  createDefaultFilters,
  filterAndSortListings,
  hasActiveFilters,
} from '../domain/filterListings';

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
  it('returns every listing with default filters', () => {
    expect(ids(filterAndSortListings(all, makeFilters()))).toEqual(['A', 'B', 'C']);
  });

  it('does not mutate the source array', () => {
    const source = [pricey, cheap];

    filterAndSortListings(source, makeFilters({ sort: 'price-asc' }));

    expect(ids(source)).toEqual(['C', 'A']);
  });

  describe('search', () => {
    it('ignores letter case', () => {
      expect(ids(filterAndSortListings(all, makeFilters({ search: 'ЛОФТ' })))).toEqual(['A']);
    });

    it('trims surrounding spaces', () => {
      expect(ids(filterAndSortListings(all, makeFilters({ search: '  студия ' })))).toEqual(['B']);
    });

    it('also searches by district and id', () => {
      expect(ids(filterAndSortListings(all, makeFilters({ search: 'аэропорт' })))).toEqual(['B']);
      expect(ids(filterAndSortListings(all, makeFilters({ search: 'c' })))).toContain('C');
    });

    it('returns an empty list when nothing matches', () => {
      expect(filterAndSortListings(all, makeFilters({ search: 'нет такого' }))).toEqual([]);
    });
  });

  describe('district', () => {
    it('keeps only listings from the chosen district', () => {
      const result = filterAndSortListings(all, makeFilters({ district: 'Старый город' }));

      expect(ids(result)).toEqual(['A', 'C']);
    });

    it('shows everything for the "all districts" value', () => {
      const result = filterAndSortListings(all, makeFilters({ district: ALL_DISTRICTS }));

      expect(result).toHaveLength(3);
    });
  });

  describe('price range', () => {
    it('includes the boundary values', () => {
      const result = filterAndSortListings(all, makeFilters({ minPrice: 20, maxPrice: 40 }));

      expect(ids(result)).toEqual(['A', 'B']);
    });

    it('supports only a lower bound', () => {
      expect(ids(filterAndSortListings(all, makeFilters({ minPrice: 41 })))).toEqual(['C']);
    });

    it('supports only an upper bound', () => {
      expect(ids(filterAndSortListings(all, makeFilters({ maxPrice: 19 })))).toEqual([]);
    });

    it('treats a zero lower bound as a real limit, not as "empty"', () => {
      expect(filterAndSortListings(all, makeFilters({ minPrice: 0, maxPrice: 0 }))).toEqual([]);
    });
  });

  describe('sorting', () => {
    it('sorts by price ascending', () => {
      const result = filterAndSortListings(
        [pricey, cheap, middle],
        makeFilters({ sort: 'price-asc' }),
      );

      expect(ids(result)).toEqual(['A', 'B', 'C']);
    });

    it('sorts by price descending', () => {
      const result = filterAndSortListings(all, makeFilters({ sort: 'price-desc' }));

      expect(ids(result)).toEqual(['C', 'B', 'A']);
    });

    it('sorts by area descending', () => {
      const result = filterAndSortListings(all, makeFilters({ sort: 'area-desc' }));

      expect(ids(result)).toEqual(['C', 'B', 'A']);
    });
  });

  it('combines several filters', () => {
    const result = filterAndSortListings(
      all,
      makeFilters({ district: 'Старый город', maxPrice: 50, sort: 'price-desc' }),
    );

    expect(ids(result)).toEqual(['A']);
  });
});

describe('hasActiveFilters', () => {
  it('is false for default filters', () => {
    expect(hasActiveFilters(createDefaultFilters())).toBe(false);
  });

  it('ignores a search made only of spaces', () => {
    expect(hasActiveFilters(makeFilters({ search: '   ' }))).toBe(false);
  });

  it('is true when any filter is changed', () => {
    expect(hasActiveFilters(makeFilters({ district: 'Аэропорт' }))).toBe(true);
    expect(hasActiveFilters(makeFilters({ minPrice: 0 }))).toBe(true);
    expect(hasActiveFilters(makeFilters({ sort: 'price-asc' }))).toBe(true);
  });
});
