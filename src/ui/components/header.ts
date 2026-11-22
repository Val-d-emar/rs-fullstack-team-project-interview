import { icon } from '../icons';

export type NavPage = 'about' | 'catalog' | 'cart';

function renderNavLink(activePage: NavPage, page: NavPage, content: string): string {
  const isActive = activePage === page;

  return `
    <button class="nav-link ${isActive ? 'is-active' : ''}" type="button"
      data-page="${page}" ${isActive ? 'aria-current="page"' : ''}>
      ${content}
    </button>`;
}

export function renderHeader(activePage: NavPage, cartCount: number, isMenuOpen: boolean): string {
  return `
    <header class="site-header ${isMenuOpen ? 'is-menu-open' : ''}">
      <a class="brand" href="#" data-page="about" aria-label="BatumiLeads — на главную">
        <span class="brand-mark" aria-hidden="true"><span></span><span></span><span></span></span>
        <span class="brand-name">Batumi<span>Leads</span></span>
      </a>

      <nav class="main-nav" id="main-nav" aria-label="Основная навигация">
        ${renderNavLink(activePage, 'about', 'О платформе')}
        ${renderNavLink(activePage, 'catalog', 'Каталог')}
        ${renderNavLink(
          activePage,
          'cart',
          `${icon('cart', 18)} Корзина <span class="cart-count" aria-label="позиций в корзине: ${cartCount}">${cartCount}</span>`,
        )}
      </nav>

      <div class="header-note"><span class="status-dot"></span> Батуми, Грузия</div>

      <button class="menu-toggle" type="button" data-menu-toggle
        aria-label="${isMenuOpen ? 'Закрыть меню' : 'Открыть меню'}"
        aria-expanded="${isMenuOpen}" aria-controls="main-nav">
        ${icon(isMenuOpen ? 'close' : 'menu', 24)}
      </button>
    </header>`;
}
