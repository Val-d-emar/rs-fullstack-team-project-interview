import './styles/main.scss';

import { listings } from './data/listings';
import { filterAndSortListings } from './domain/filterListings';
import { store } from './state/store';
import type { AppState } from './state/store';
import { ALL_DISTRICTS, DISTRICTS } from './types/store';
import type { DistrictFilter, PageId, SortOption } from './types/store';
import { renderFooter } from './ui/components/footer';
import { renderHeader } from './ui/components/header';
import { renderListingModal, renderModalFooter } from './ui/components/listingModal';
import { escapeHtml } from './ui/escapeHtml';
import { getCurrentIndex, goToSlide, syncGallery } from './ui/galleryControls';
import { renderAboutPage } from './ui/pages/aboutPage';
import { renderCatalogPage } from './ui/pages/catalogPage';
import type { SelectId } from './ui/pages/catalogPage';

const CART_STUB = {
  title: 'Корзина доступов',
  description: 'Список выбранных контактов и промокоды будут реализованы в задачах 4.1 и 4.2.',
  nextPage: 'about' as PageId,
  cta: 'Вернуться на главную',
};

const appElement = document.querySelector<HTMLDivElement>('#app');

if (!appElement) {
  throw new Error('App root element #app was not found');
}

const app: HTMLDivElement = appElement;
const modalRoot = document.createElement('div');
modalRoot.id = 'modal-root';
document.body.append(modalRoot);

let isMenuOpen = false;
let openSelect: SelectId | null = null;
let openListingId: string | null = null;
let pendingFocus: string | null = null;

function isPageId(value: string | undefined): value is PageId {
  return value === 'about' || value === 'catalog' || value === 'cart';
}

function isSelectId(value: string | undefined): value is SelectId {
  return value === 'district' || value === 'sort';
}

function isDistrictFilter(value: string): value is DistrictFilter {
  return value === ALL_DISTRICTS || (DISTRICTS as readonly string[]).includes(value);
}

function isSortOption(value: string): value is SortOption {
  return (
    value === 'default' || value === 'price-asc' || value === 'price-desc' || value === 'area-desc'
  );
}

function renderPage(state: AppState): string {
  switch (state.currentPage) {
    case 'about':
      return renderAboutPage({
        listingsCount: listings.length,
        sourcesCount: new Set(listings.map((item) => item.source)).size,
        districtsCount: DISTRICTS.length,
      });

    case 'catalog':
      return renderCatalogPage({
        shown: filterAndSortListings(listings, state.filters),
        totalCount: listings.length,
        cartIds: state.cart.map((item) => item.id),
        filters: state.filters,
        openSelect,
      });

    case 'cart':
      return `
        <main class="page">
          <section class="shell-stub">
            <h1>${escapeHtml(CART_STUB.title)}</h1>
            <p>${escapeHtml(CART_STUB.description)}</p>
            <button class="button button-lemon" type="button" data-page="${CART_STUB.nextPage}">
              ${escapeHtml(CART_STUB.cta)}
            </button>
          </section>
        </main>`;
  }
}

function restoreInputFocus(activeId: string, cursor: number | null): void {
  const element = activeId ? document.getElementById(activeId) : null;

  if (!(element instanceof HTMLInputElement)) return;

  element.focus();

  if (cursor !== null) element.setSelectionRange(cursor, cursor);
}

function render(): void {
  const state = store.getState();
  const active = document.activeElement;
  const activeInputId = active instanceof HTMLInputElement ? active.id : '';
  const cursor =
    active instanceof HTMLInputElement && active.type !== 'number' ? active.selectionStart : null;
  const cartCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);

  app.innerHTML = `
    ${renderHeader(state.currentPage, cartCount, isMenuOpen)}
    ${renderPage(state)}
    ${renderFooter()}
  `;

  restoreInputFocus(activeInputId, cursor);

  if (pendingFocus) {
    document.querySelector<HTMLElement>(pendingFocus)?.focus();
    pendingFocus = null;
  }
}

function openModal(id: string): void {
  const item = listings.find((listing) => listing.id === id);
  if (!item) return;

  openListingId = id;
  const inCart = store.getState().cart.some((line) => line.id === id);

  modalRoot.innerHTML = renderListingModal(item, inCart);
  document.body.classList.add('is-modal-open');
  modalRoot.querySelector<HTMLElement>('.modal-close')?.focus();
}

function closeModal(restoreFocus = true): void {
  if (!openListingId) return;

  const closedId = openListingId;

  openListingId = null;
  modalRoot.innerHTML = '';
  document.body.classList.remove('is-modal-open');

  if (restoreFocus) {
    document.querySelector<HTMLElement>(`button[data-open="${closedId}"]`)?.focus();
  }
}

function refreshModalFooter(): void {
  const item = listings.find((listing) => listing.id === openListingId);
  const footer = modalRoot.querySelector<HTMLElement>('#modal-footer');
  if (!item || !footer) return;

  const inCart = store.getState().cart.some((line) => line.id === item.id);
  footer.innerHTML = renderModalFooter(item, inCart);
}

function trapFocusInModal(event: KeyboardEvent): void {
  const dialog = modalRoot.querySelector<HTMLElement>('.modal');
  if (!dialog) return;

  const focusable = Array.from(
    dialog.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex="0"]'),
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (!first || !last) return;

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function navigate(page: PageId): void {
  const shouldRerenderSamePage = isMenuOpen || openSelect !== null;

  isMenuOpen = false;
  openSelect = null;
  closeModal(false);

  if (store.getState().currentPage === page) {
    if (shouldRerenderSamePage) render();
    return;
  }

  store.setPage(page);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleSelect(id: SelectId): void {
  openSelect = openSelect === id ? null : id;
  pendingFocus = openSelect ? '.select-option[aria-selected="true"]' : `#${id}-trigger`;
  render();
}

function chooseSelectOption(selectId: SelectId, value: string): void {
  openSelect = null;
  pendingFocus = `#${selectId}-trigger`;

  if (selectId === 'district' && isDistrictFilter(value)) {
    store.setFilters({ district: value });
    return;
  }

  if (selectId === 'sort' && isSortOption(value)) {
    store.setFilters({ sort: value });
    return;
  }

  render();
}

function parsePrice(value: string): number | null {
  if (value.trim() === '') return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : null;
}

function handleClick(event: MouseEvent): void {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const hadOpenSelect = openSelect !== null;
  if (hadOpenSelect && !target.closest('.custom-select')) {
    openSelect = null;
  }

  if (target.classList.contains('modal-backdrop') || target.closest('.modal-close')) {
    closeModal();
    if (hadOpenSelect) render();
    return;
  }

  const pageButton = target.closest<HTMLElement>('[data-page]');
  if (pageButton && isPageId(pageButton.dataset.page)) {
    event.preventDefault();
    navigate(pageButton.dataset.page);
    return;
  }

  if (target.closest('[data-menu-toggle]')) {
    isMenuOpen = !isMenuOpen;
    render();
    return;
  }

  const selectToggle = target.closest<HTMLElement>('[data-select-toggle]');
  if (selectToggle && isSelectId(selectToggle.dataset.selectToggle)) {
    toggleSelect(selectToggle.dataset.selectToggle);
    return;
  }

  const selectOption = target.closest<HTMLElement>('[data-select-option]');
  if (
    selectOption &&
    isSelectId(selectOption.dataset.selectOption) &&
    selectOption.dataset.value !== undefined
  ) {
    chooseSelectOption(selectOption.dataset.selectOption, selectOption.dataset.value);
    return;
  }

  const addButton = target.closest<HTMLElement>('[data-add]');
  if (addButton?.dataset.add) {
    store.addToCart(addButton.dataset.add);
    refreshModalFooter();
    return;
  }

  if (target.closest('[data-reset-filters]')) {
    store.resetFilters();
    return;
  }

  const galleryStep = target.closest<HTMLElement>('[data-gallery-step]');
  if (galleryStep) {
    goToSlide(modalRoot, getCurrentIndex(modalRoot) + Number(galleryStep.dataset.galleryStep));
    return;
  }

  const galleryThumb = target.closest<HTMLElement>('[data-gallery-goto]');
  if (galleryThumb) {
    goToSlide(modalRoot, Number(galleryThumb.dataset.galleryGoto));
    return;
  }

  const openTrigger = target.closest<HTMLElement>('[data-open]');
  if (openTrigger?.dataset.open && !target.closest('button, a')) {
    openModal(openTrigger.dataset.open);
    if (hadOpenSelect) render();
    return;
  }

  if (hadOpenSelect) render();
}

function handleInput(event: Event): void {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;

  switch (target.id) {
    case 'catalog-search':
      store.setFilters({ search: target.value });
      break;

    case 'min-price':
      store.setFilters({ minPrice: parsePrice(target.value) });
      break;

    case 'max-price':
      store.setFilters({ maxPrice: parsePrice(target.value) });
      break;
  }
}

function moveFocusInSelectMenu(event: KeyboardEvent): void {
  const options = Array.from(document.querySelectorAll<HTMLElement>('.select-option'));
  const currentIndex = options.indexOf(document.activeElement as HTMLElement);
  if (currentIndex === -1) return;

  event.preventDefault();
  const step = event.key === 'ArrowDown' ? 1 : -1;
  const nextIndex = (currentIndex + step + options.length) % options.length;
  options[nextIndex]?.focus();
}

function handleDocumentKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    if (openListingId) {
      closeModal();
    } else if (openSelect) {
      pendingFocus = `#${openSelect}-trigger`;
      openSelect = null;
      render();
    } else if (isMenuOpen) {
      isMenuOpen = false;
      render();
    }
    return;
  }

  if (event.key === 'Tab' && openListingId) {
    trapFocusInModal(event);
    return;
  }

  if (openSelect && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
    moveFocusInSelectMenu(event);
  }
}

function handleImageError(event: Event): void {
  if (event.target instanceof HTMLImageElement) {
    event.target.remove();
  }
}

store.subscribe(render);
app.addEventListener('click', handleClick);
modalRoot.addEventListener('click', handleClick);
app.addEventListener('input', handleInput);
document.addEventListener('keydown', handleDocumentKeydown);
document.addEventListener('error', handleImageError, true);
modalRoot.addEventListener('scroll', () => syncGallery(modalRoot), true);

render();
