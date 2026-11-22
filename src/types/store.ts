export const ALL_DISTRICTS = 'all' as const;

export const DISTRICTS = [
  'Старый город',
  'Новый бульвар',
  'Багратиони',
  'Химшиашвили',
  'Аэропорт',
] as const;

export type District = (typeof DISTRICTS)[number];
export type DistrictFilter = District | typeof ALL_DISTRICTS;

export type PageId = 'about' | 'catalog' | 'cart';
export type SourceId = 'ss.ge' | 'korter.ge' | 'fb' | 'manual';
export type SortOption = 'default' | 'price-asc' | 'price-desc' | 'area-desc';
export type PromoStatus = 'none' | 'applied' | 'invalid';

export type PromoRules = Readonly<Record<string, number>>;

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
}

export interface Listing {
  id: string;
  title: string;
  district: District;
  price: number;
  area: number;
  rooms: number;
  floor: number;
  totalFloors: number;
  source: SourceId;
  seller: string;
  publishedAt: string;
  description: string;
  details: string;
  features: string[];
  images: string[];
  contactHint: string;
  tag?: string;
}

export interface FilterState {
  search: string;
  district: DistrictFilter;
  minPrice: number | null;
  maxPrice: number | null;
  sort: SortOption;
}

export interface CartItem {
  id: string;
  quantity: number;
}

export interface CartTotals {
  itemCount: number;
  subtotal: number;
  discountPercent: number;
  discount: number;
  total: number;
  promoStatus: PromoStatus;
}
