import { describe, expect, it } from 'vitest';

import { DISTRICTS } from '../types/store';
import { listings } from './listings';
import { PROMO_RULES } from './promos';

describe('listings catalog data', () => {
  it('contains 8 to 12 listings across at least two districts', () => {
    expect(listings.length).toBeGreaterThanOrEqual(8);
    expect(listings.length).toBeLessThanOrEqual(12);

    const uniqueDistricts = new Set(listings.map((item) => item.district));
    expect(uniqueDistricts.size).toBeGreaterThanOrEqual(2);
  });

  it('has unique IDs and valid positive specs for every listing', () => {
    const ids = listings.map((item) => item.id);
    expect(new Set(ids).size).toBe(listings.length);

    for (const item of listings) {
      expect(item.id.trim().length).toBeGreaterThan(0);
      expect(item.price).toBeGreaterThan(0);
      expect(item.area).toBeGreaterThan(0);
      expect(item.rooms).toBeGreaterThan(0);
      expect(item.floor).toBeGreaterThanOrEqual(1);
      expect(item.floor).toBeLessThanOrEqual(item.totalFloors);
      expect(DISTRICTS).toContain(item.district);
    }
  });

  it('defines valid percentage discounts in PROMO_RULES', () => {
    for (const discount of Object.values(PROMO_RULES)) {
      expect(discount).toBeGreaterThan(0);
      expect(discount).toBeLessThanOrEqual(100);
    }
  });
});
