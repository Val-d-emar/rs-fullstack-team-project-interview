import { ALL_DISTRICTS } from '../types/store';
import type { SelectOption, SourceId } from '../types/store';

export const DISTRICTS = [
  'Старый город',
  'Новый бульвар',
  'Багратиони',
  'Химшиашвили',
  'Аэропорт',
] as const;

export const DISTRICT_OPTIONS: SelectOption[] = [
  { value: ALL_DISTRICTS, label: 'Все районы' },
  ...DISTRICTS.map((district) => ({ value: district, label: district })),
];

export const SORT_OPTIONS: SelectOption[] = [
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
