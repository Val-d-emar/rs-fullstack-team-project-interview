import { ALL_DISTRICTS } from '../types/store';
import type { FilterState, Listing, SortOption } from '../types/store';

export function createDefaultFilters(): FilterState {
  return { search: '', district: ALL_DISTRICTS, minPrice: null, maxPrice: null, sort: 'default' };
}

export function hasActiveFilters(filters: FilterState): boolean {
  const defaults = createDefaultFilters();

  return (
    filters.search.trim() !== defaults.search ||
    filters.district !== defaults.district ||
    filters.minPrice !== defaults.minPrice ||
    filters.maxPrice !== defaults.maxPrice ||
    filters.sort !== defaults.sort
  );
}

function matchesSearch(listing: Listing, query: string): boolean {
  if (!query) return true;

  const haystack = `${listing.id} ${listing.title} ${listing.description} ${listing.district}`;

  return haystack.toLowerCase().includes(query);
}

function matchesDistrict(listing: Listing, district: string): boolean {
  return district === ALL_DISTRICTS || listing.district === district;
}

function matchesPrice(listing: Listing, minPrice: number | null, maxPrice: number | null): boolean {
  const aboveMin = minPrice === null || listing.price >= minPrice;
  const belowMax = maxPrice === null || listing.price <= maxPrice;

  return aboveMin && belowMax;
}

const comparators: Record<SortOption, (a: Listing, b: Listing) => number> = {
  default: () => 0,
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  'area-desc': (a, b) => b.area - a.area,
};

export function filterAndSortListings(
  listings: readonly Listing[],
  filters: FilterState,
): Listing[] {
  const query = filters.search.trim().toLowerCase();

  return listings
    .filter(
      (listing) =>
        matchesSearch(listing, query) &&
        matchesDistrict(listing, filters.district) &&
        matchesPrice(listing, filters.minPrice, filters.maxPrice),
    )
    .sort(comparators[filters.sort]);
}
