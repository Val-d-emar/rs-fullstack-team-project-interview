import { escapeHtml } from '../escapeHtml';
import { icon } from '../icons';
import { renderCustomSelect } from '../components/customSelect';
import { renderListingCard } from '../components/listingCard';
import { DISTRICT_OPTIONS, SORT_OPTIONS } from '../../data/catalogOptions';
import { hasActiveFilters } from '../../domain/filterListings';
import type { FilterState, Listing } from '../../types/store';

export interface CatalogPageData {
  shown: Listing[];
  totalCount: number;
  cartIds: string[];
  filters: FilterState;
  openSelect: string | null;
}

function renderPriceField(id: string, label: string, value: number | null): string {
  return `
    <label class="field field-price" for="${id}">
      <span class="field-label">${label}</span>
      <span class="input-wrap">
        <input id="${id}" type="number" inputmode="numeric" min="0" placeholder="Любая"
          value="${value ?? ''}">
        <span class="input-suffix">₾</span>
      </span>
    </label>`;
}

function renderEmptyState(): string {
  return `
    <section class="empty-state">
      <div class="empty-icon">${icon('search', 26)}</div>
      <h2>Ничего не найдено</h2>
      <p>Попробуйте изменить запрос, выбрать другой район или расширить диапазон цены.</p>
      <button class="button button-dark" type="button" data-reset-filters>${icon('refresh', 18)} Сбросить фильтры</button>
    </section>`;
}

export function renderCatalogPage(data: CatalogPageData): string {
  const { shown, totalCount, cartIds, filters, openSelect } = data;

  return `
    <main class="page catalog-page">
      <section class="page-intro">
        <h1>Каталог объектов</h1>
        <p>Выбирайте объекты, изучайте детали и получайте доступ к контактам собственников.</p>
      </section>

      <section class="catalog-toolbar" aria-label="Поиск и фильтры">
        <label class="field field-search" for="catalog-search">
          <span class="field-label">Поиск</span>
          <span class="input-wrap">
            ${icon('search', 20)}
            <input id="catalog-search" type="search" placeholder="Название, район или ID"
              value="${escapeHtml(filters.search)}" autocomplete="off">
          </span>
        </label>

        ${renderCustomSelect({
          id: 'district',
          label: 'Район',
          options: DISTRICT_OPTIONS,
          value: filters.district,
          isOpen: openSelect === 'district',
        })}
        ${renderCustomSelect({
          id: 'sort',
          label: 'Сортировка',
          options: SORT_OPTIONS,
          value: filters.sort,
          isOpen: openSelect === 'sort',
        })}

        ${renderPriceField('min-price', 'Цена доступа от', filters.minPrice)}
        ${renderPriceField('max-price', 'Цена доступа до', filters.maxPrice)}

        <div class="toolbar-summary">
          <span class="results-count" aria-live="polite">Найдено <b>${shown.length}</b> из ${totalCount}</span>
          ${
            hasActiveFilters(filters)
              ? `<button class="reset-button" type="button" data-reset-filters>${icon('refresh', 16)} Сбросить</button>`
              : ''
          }
        </div>
      </section>

      ${
        shown.length
          ? `<section class="listing-grid" aria-label="Список объектов">${shown
              .map((item) => renderListingCard(item, cartIds.includes(item.id)))
              .join('')}</section>`
          : renderEmptyState()
      }

      <p class="catalog-footnote"><span class="status-dot"></span> Демо-каталог: данные тестовые, оплата не подключена</p>
    </main>`;
}
