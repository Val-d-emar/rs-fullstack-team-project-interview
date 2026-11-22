import { ALL_DISTRICTS, DISTRICTS } from '../types/store';
import type { DistrictFilter, SelectOption, SortOption, SourceId } from '../types/store';

export const DISTRICT_OPTIONS: readonly SelectOption<DistrictFilter>[] = [
  { value: ALL_DISTRICTS, label: 'Все районы' },
  ...DISTRICTS.map((district) => ({ value: district, label: district })),
];

export const SORT_OPTIONS: readonly SelectOption<SortOption>[] = [
  { value: 'default', label: 'По умолчанию' },
  { value: 'price-asc', label: 'Сначала дешевле' },
  { value: 'price-desc', label: 'Сначала дороже' },
  { value: 'area-desc', label: 'Сначала большие' },
];

export const SOURCE_LABELS: Readonly<Record<SourceId, string>> = {
  'ss.ge': 'ss.ge',
  'korter.ge': 'korter.ge',
  fb: 'Facebook',
  manual: 'Ручной ввод',
};
