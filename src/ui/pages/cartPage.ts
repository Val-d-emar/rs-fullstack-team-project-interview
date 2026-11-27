import { escapeHtml } from '../escapeHtml';
import { icon } from '../icons';
import { formatPrice } from '../components/listingCard';
import { SOURCE_LABELS } from '../../data/catalogOptions';
import { PROMO_RULES } from '../../data/promos';
import { calculateCartTotals, toPromoRuleList } from '../../domain/calculateCart';
import type { Listing, PromoStatus } from '../../types/store';

export interface CartPageData {
  listings: readonly Listing[];
  cartIds: readonly string[];
  promoCode: string;
}

function getCartListings(data: CartPageData): Listing[] {
  return data.cartIds.flatMap((id) => {
    const listing = data.listings.find((item) => item.id === id);

    return listing ? [listing] : [];
  });
}

function renderCartRow(item: Listing): string {
  const id = escapeHtml(item.id);
  const cover = item.images[0];

  return `
    <article class="cart-row">
      <div class="cart-thumb">
        ${cover ? `<img src="${escapeHtml(cover)}" alt="" loading="lazy">` : ''}
      </div>

      <div class="cart-item-info">
        <span>
          ${escapeHtml(item.district)}
          ·
          ${escapeHtml(SOURCE_LABELS[item.source])}
        </span>

        <h3>${escapeHtml(item.title)}</h3>

        <small>Доступ к контакту собственника</small>
      </div>

      <strong class="cart-line-price">
        ${formatPrice(item.price)} ₾
      </strong>

      <button
        class="remove-item"
        type="button"
        data-remove="${id}"
        aria-label="Удалить из корзины">
        ${icon('close', 18)}
      </button>
    </article>
  `;
}

function renderPromoMessage(promoStatus: PromoStatus, discountPercent: number): string {
  if (promoStatus === 'applied') {
    return `
      <p class="promo-success" role="status">
        ${icon('check', 16)}
        Промокод применён: скидка ${discountPercent}%
      </p>
    `;
  }

  if (promoStatus === 'invalid') {
    return `
      <p class="promo-error" role="alert">
        Такого промокода нет.
        Проверьте код и попробуйте снова.
      </p>
    `;
  }

  return '';
}

function renderSummary(promoCode: string, totals: ReturnType<typeof calculateCartTotals>): string {
  return `
    <aside class="order-summary" aria-label="Итог заказа">
      <h2>Ваш заказ</h2>

      <div class="promo-box">
        <label for="promo-input">Промокод</label>

        <form class="promo-row" data-promo-form>
          <input
            id="promo-input"
            type="text"
            value="${escapeHtml(promoCode)}"
            placeholder="Например, AGENT10"
            autocomplete="off"
            aria-label="Введите промокод">

          <button type="button" data-apply-promo>
            Применить
          </button>
        </form>

        ${renderPromoMessage(totals.promoStatus, totals.discountPercent)}

        ${
          totals.promoStatus === 'applied'
            ? `
            <button
              class="promo-reset"
              type="button"
              data-reset-promo>
              Сбросить промокод
            </button>
          `
            : ''
        }
      </div>

      <div class="summary-line">
        <span>Сумма до скидки</span>
        <b>${formatPrice(totals.subtotal)} ₾</b>
      </div>

      <div class="summary-line discount-line">
        <span>Скидка</span>
        <b>−${formatPrice(totals.discount)} ₾</b>
      </div>

      <div class="summary-total">
        <span>Итого к оплате</span>
        <strong>
          ${formatPrice(totals.total)}
          <i>₾</i>
        </strong>
      </div>

      <button
        class="button button-lemon button-large checkout-button"
        type="button"
        data-demo-checkout>
        Перейти к оформлению
        ${icon('arrowRight', 18)}
      </button>

      <p class="summary-disclaimer">
        Демо-версия: реальная оплата в MVP не подключена.
      </p>
    </aside>
  `;
}

function renderEmptyCart(): string {
  return `
    <section class="empty-state">
      <div class="empty-icon">
        ${icon('cart', 26)}
      </div>

      <h2>Корзина пуста</h2>

      <p>
        Добавьте интересующие объекты из каталога,
        чтобы собрать нужные контакты в одном месте.
      </p>

      <div class="empty-total">
        <span>Итого к оплате</span>
        <strong>0 ₾</strong>
      </div>

      <button
        class="button button-dark"
        type="button"
        data-page="catalog">
        Перейти в каталог
        ${icon('arrowRight', 18)}
      </button>
    </section>
  `;
}

export function renderCartPage(data: CartPageData): string {
  const cartListings = getCartListings(data);

  const totals = calculateCartTotals(cartListings, data.promoCode, toPromoRuleList(PROMO_RULES));

  const rows = cartListings.map(renderCartRow).join('');

  return `
    <main class="page cart-page">

      <section class="page-intro">
        <h1>Корзина</h1>

        <p>
          ${
            totals.itemCount
              ? `Контактов в корзине: ${totals.itemCount}. Проверьте список перед оформлением.`
              : 'Здесь появятся выбранные объекты.'
          }
        </p>
      </section>

      ${
        cartListings.length
          ? `
          <div class="cart-layout">

            <section
              class="cart-items"
              aria-label="Выбранные объекты">

              ${rows}

              <button
                class="continue-link"
                type="button"
                data-page="catalog">
                ${icon('arrowLeft', 18)}
                Продолжить выбор
              </button>
            </section>

            ${renderSummary(data.promoCode, totals)}

          </div>
        `
          : renderEmptyCart()
      }

    </main>
  `;
}
