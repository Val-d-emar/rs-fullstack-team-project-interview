import './styles/main.scss';

import { store } from './state/store';
import type { PageId } from './types/store';
import { renderFooter } from './ui/components/footer';
import { renderHeader } from './ui/components/header';
import { escapeHtml } from './ui/escapeHtml';

const PAGE_STUBS: Record<
  PageId,
  { title: string; description: string; nextPage: PageId; cta: string }
> = {
  about: {
    title: 'О платформе BatumiLeads',
    description: 'Стартовый раздел «О нас» будет реализован в задаче 2.2.',
    nextPage: 'catalog',
    cta: 'Перейти в каталог',
  },
  catalog: {
    title: 'Каталог объектов Батуми',
    description: 'Карточки лидов, поиск и фильтры будут реализованы в задачах 3.1 и 3.2.',
    nextPage: 'cart',
    cta: 'Открыть корзину',
  },
  cart: {
    title: 'Корзина доступов',
    description: 'Список выбранных контактов и промокоды будут реализованы в задачах 4.1 и 4.2.',
    nextPage: 'about',
    cta: 'Вернуться на главную',
  },
};

const appElement = document.querySelector<HTMLDivElement>('#app');

if (!appElement) {
  throw new Error('App root element #app was not found');
}

const app: HTMLDivElement = appElement;
let isMenuOpen = false;

function isPageId(value: string | undefined): value is PageId {
  return value === 'about' || value === 'catalog' || value === 'cart';
}

function renderPageStub(page: PageId): string {
  const stub = PAGE_STUBS[page];

  return `
    <main class="page">
      <section class="shell-stub">
        <h1>${escapeHtml(stub.title)}</h1>
        <p>${escapeHtml(stub.description)}</p>
        <button class="button button-lemon" type="button" data-page="${stub.nextPage}">
          ${escapeHtml(stub.cta)}
        </button>
      </section>
    </main>`;
}

function render(): void {
  const state = store.getState();
  const cartCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);

  app.innerHTML = `
    ${renderHeader(state.currentPage, cartCount, isMenuOpen)}
    ${renderPageStub(state.currentPage)}
    ${renderFooter()}
  `;
}

function navigate(page: PageId): void {
  const wasMenuOpen = isMenuOpen;

  isMenuOpen = false;

  if (store.getState().currentPage === page) {
    if (wasMenuOpen) render();
    return;
  }

  store.setPage(page);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleAppClick(event: MouseEvent): void {
  const target = event.target;

  if (!(target instanceof HTMLElement)) return;

  const pageButton = target.closest<HTMLElement>('[data-page]');

  if (pageButton && isPageId(pageButton.dataset.page)) {
    event.preventDefault();
    navigate(pageButton.dataset.page);
    return;
  }

  if (target.closest('[data-menu-toggle]')) {
    isMenuOpen = !isMenuOpen;
    render();
  }
}

function handleDocumentKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && isMenuOpen) {
    isMenuOpen = false;
    render();
  }
}

function handleImageError(event: Event): void {
  if (event.target instanceof HTMLImageElement) {
    event.target.remove();
  }
}

store.subscribe(render);
app.addEventListener('click', handleAppClick);
document.addEventListener('keydown', handleDocumentKeydown);
document.addEventListener('error', handleImageError, true);

render();
