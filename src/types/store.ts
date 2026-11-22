export const ALL_DISTRICTS = 'all';

export type SourceId = 'ss.ge' | 'korter.ge' | 'fb' | 'manual';
export type SortOption = 'default' | 'price-asc' | 'price-desc' | 'area-desc';
export type PromoStatus = 'none' | 'applied' | 'invalid';

export interface SelectOption {
  value: string;
  label: string;
}

export interface Listing {
  id: string;
  title: string;
  district: string;
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
  district: string;
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
