import './styles/main.scss';

import { listings } from './data/listings';
import { DISTRICTS } from './data/catalogOptions';
import { PROMO_RULES } from './data/promos';
import { calculateCartTotals } from './domain/calculateCart';
import { createDefaultFilters, filterAndSortListings } from './domain/filterListings';
import { getCurrentIndex, goToSlide, syncGallery } from './ui/galleryControls';

import { renderHeader } from './ui/components/header';
import type { NavPage } from './ui/components/header';
import { renderFooter } from './ui/components/footer';
import { renderListingModal, renderModalFooter } from './ui/components/listingModal';
import { renderAboutPage } from './ui/pages/aboutPage';
import { renderCatalogPage } from './ui/pages/catalogPage';
import { renderCartPage } from './ui/pages/cartPage';

import type { CartItem, FilterState, SortOption } from './types/store';

let currentPage: NavPage = 'about';
let cart: CartItem[] = [];
let filters: FilterState = createDefaultFilters();
let promoCode = '';
let openSelect: string | null = null;
let openListingId: string | null = null;
let isMenuOpen = false;
let pendingFocus: string | null = null;

const appElement = document.querySelector<HTMLDivElement>('#app');

if (!appElement) {
  throw new Error('App root element #app was not found');
}

const app: HTMLDivElement = appElement;
const modalRoot = document.createElement('div');

modalRoot.id = 'modal-root';
document.body.append(modalRoot);

function renderPage(): string {
  switch (currentPage) {
    case 'about':
      return renderAboutPage({
        listingsCount: listings.length,
        sourcesCount: new Set(listings.map((item) => item.source)).size,
        districtsCount: DISTRICTS.length,
      });

    case 'catalog':
      return renderCatalogPage({
        shown: filterAndSortListings(listings, filters),
        totalCount: listings.length,
        cartIds: cart.map((item) => item.id),
        filters,
        openSelect,
      });

    case 'cart':
      return renderCartPage({
        listings,
        items: cart,
        promoCode,
        totals: calculateCartTotals(cart, listings, promoCode, PROMO_RULES),
      });
  }
}

function restoreInputFocus(activeId: string, cursor: number | null): void {
  const element = activeId ? document.getElementById(activeId) : null;

  if (!(element instanceof HTMLInputElement)) return;

  element.focus();

  if (cursor !== null) element.setSelectionRange(cursor, cursor);
}

function render(): void {
  const active = document.activeElement;
  const activeInputId = active instanceof HTMLInputElement ? active.id : '';
  const cursor = active instanceof HTMLInputElement ? active.selectionStart : null;
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  app.innerHTML = `
    ${renderHeader(currentPage, cartCount, isMenuOpen)}
    ${renderPage()}
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
  modalRoot.innerHTML = renderListingModal(
    item,
    cart.some((line) => line.id === id),
  );
  document.body.classList.add('is-modal-open');
  modalRoot.querySelector<HTMLElement>('.modal-close')?.focus();
}

function closeModal(): void {
  if (!openListingId) return;

  const closedId = openListingId;

  openListingId = null;
  modalRoot.innerHTML = '';
  document.body.classList.remove('is-modal-open');
  document.querySelector<HTMLElement>(`button[data-open="${closedId}"]`)?.focus();
}

function refreshModalFooter(): void {
  const item = listings.find((listing) => listing.id === openListingId);
  const footer = modalRoot.querySelector<HTMLElement>('#modal-footer');

  if (!item || !footer) return;

  footer.innerHTML = renderModalFooter(
    item,
    cart.some((line) => line.id === item.id),
  );
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

function navigate(page: NavPage): void {
  currentPage = page;
  isMenuOpen = false;
  openSelect = null;
  closeModal();
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function addToCart(id: string): void {
  const existing = cart.find((item) => item.id === id);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ id, quantity: 1 });
  }

  render();
  refreshModalFooter();
}

function updateQuantity(id: string, delta: number): void {
  const item = cart.find((entry) => entry.id === id);

  if (!item) return;

  item.quantity = Math.max(1, item.quantity + delta);
  render();
}

function removeFromCart(id: string): void {
  cart = cart.filter((item) => item.id !== id);
  render();
}

function applyPromoCode(): void {
  const input = document.querySelector<HTMLInputElement>('#promo-input');

  if (!input) return;

  promoCode = input.value.trim().toUpperCase();
  render();
}

function resetFilters(): void {
  filters = createDefaultFilters();
  render();
}

function toggleSelect(id: string): void {
  openSelect = openSelect === id ? null : id;
  pendingFocus = openSelect ? '.select-option[aria-selected="true"]' : `#${id}-trigger`;
  render();
}

function chooseSelectOption(selectId: string, value: string): void {
  if (selectId === 'district') filters.district = value;
  if (selectId === 'sort') filters.sort = value as SortOption;

  openSelect = null;
  pendingFocus = `#${selectId}-trigger`;
  render();
}

function parsePrice(value: string): number | null {
  return value === '' ? null : Math.max(0, Number(value));
}

function handleClick(event: MouseEvent): void {
  const target = event.target;

  if (!(target instanceof HTMLElement)) return;

  if (openSelect && !target.closest('.custom-select')) {
    openSelect = null;
    render();
  }

  if (target.classList.contains('modal-backdrop') || target.closest('.modal-close')) {
    closeModal();
    return;
  }

  const pageButton = target.closest<HTMLElement>('[data-page]');

  if (pageButton) {
    event.preventDefault();
    navigate(pageButton.dataset.page as NavPage);
    return;
  }

  if (target.closest('[data-menu-toggle]')) {
    isMenuOpen = !isMenuOpen;
    render();
    return;
  }

  const selectToggle = target.closest<HTMLElement>('[data-select-toggle]');

  if (selectToggle?.dataset.selectToggle) {
    toggleSelect(selectToggle.dataset.selectToggle);
    return;
  }

  const selectOption = target.closest<HTMLElement>('[data-select-option]');

  if (selectOption?.dataset.selectOption && selectOption.dataset.value !== undefined) {
    chooseSelectOption(selectOption.dataset.selectOption, selectOption.dataset.value);
    return;
  }

  const addButton = target.closest<HTMLElement>('[data-add]');

  if (addButton?.dataset.add) {
    addToCart(addButton.dataset.add);
    return;
  }

  const quantityButton = target.closest<HTMLElement>('[data-qty]');

  if (quantityButton?.dataset.qty) {
    updateQuantity(quantityButton.dataset.qty, Number(quantityButton.dataset.delta));
    return;
  }

  const removeButton = target.closest<HTMLElement>('[data-remove]');

  if (removeButton?.dataset.remove) {
    removeFromCart(removeButton.dataset.remove);
    return;
  }

  if (target.closest('[data-apply-promo]')) {
    applyPromoCode();
    return;
  }

  if (target.closest('[data-reset-filters]')) {
    resetFilters();
    return;
  }

  if (target.closest('[data-demo-checkout]')) {
    alert('Это демонстрационная версия BatumiLeads. Реальная оплата пока не подключена.');
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

  if (openTrigger?.dataset.open) openModal(openTrigger.dataset.open);
}

function handleInput(event: Event): void {
  const target = event.target;

  if (!(target instanceof HTMLInputElement)) return;

  switch (target.id) {
    case 'catalog-search':
      filters.search = target.value;
      break;

    case 'min-price':
      filters.minPrice = parsePrice(target.value);
      break;

    case 'max-price':
      filters.maxPrice = parsePrice(target.value);
      break;

    default:
      return;
  }

  render();
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

function handleKeydown(event: KeyboardEvent): void {
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

app.addEventListener('click', handleClick);
modalRoot.addEventListener('click', handleClick);
app.addEventListener('input', handleInput);
document.addEventListener('keydown', handleKeydown);

modalRoot.addEventListener('scroll', () => syncGallery(modalRoot), true);

render();
