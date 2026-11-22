import { escapeHtml } from '../escapeHtml';
import { icon } from '../icons';
import { formatPrice } from '../components/listingCard';
import { SOURCE_LABELS } from '../../data/catalogOptions';
import type { CartItem, CartTotals, Listing } from '../../types/store';

export interface CartPageData {
  listings: readonly Listing[];
  items: readonly CartItem[];
  promoCode: string;
  totals: CartTotals;
}

function renderCartRow(item: Listing, quantity: number): string {
  const id = escapeHtml(item.id);
  const cover = item.images[0];

  return `
    <article class="cart-row">
      <div class="cart-thumb">${cover ? `<img src="${escapeHtml(cover)}" alt="" onerror="this.remove()">` : ''}</div>
      <div class="cart-item-info">
        <span>${escapeHtml(item.district)} · ${escapeHtml(SOURCE_LABELS[item.source])}</span>
        <h3>${escapeHtml(item.title)}</h3>
        <small>Доступ к контакту собственника · ${formatPrice(item.price)} ₾</small>
      </div>
      <div class="quantity-control" role="group" aria-label="Количество доступов">
        <button type="button" data-qty="${id}" data-delta="-1" aria-label="Уменьшить" ${quantity <= 1 ? 'disabled' : ''}>${icon('minus', 16)}</button>
        <b>${quantity}</b>
        <button type="button" data-qty="${id}" data-delta="1" aria-label="Увеличить">${icon('plus', 16)}</button>
      </div>
      <strong class="cart-line-price">${formatPrice(item.price * quantity)} ₾</strong>
      <button class="remove-item" type="button" data-remove="${id}" aria-label="Удалить из корзины">${icon('close', 18)}</button>
    </article>`;
}

function renderPromoMessage(totals: CartTotals): string {
  if (totals.promoStatus === 'applied') {
    return `<p class="promo-success">${icon('check', 16)} Промокод применён: скидка ${totals.discountPercent}%</p>`;
  }

  if (totals.promoStatus === 'invalid') {
    return '<p class="promo-error">Такого промокода нет. Проверьте код и попробуйте снова.</p>';
  }

  return '';
}

function renderSummary(data: CartPageData): string {
  const { totals, promoCode } = data;

  return `
    <aside class="order-summary" aria-label="Итог заказа">
      <h2>Ваш заказ</h2>

      <div class="promo-box">
        <label for="promo-input">Промокод</label>
        <div class="promo-row">
          <input id="promo-input" value="${escapeHtml(promoCode)}" placeholder="Например, AGENT10" autocomplete="off">
          <button type="button" data-apply-promo>Применить</button>
        </div>
        ${renderPromoMessage(totals)}
      </div>

      <div class="summary-line"><span>Сумма доступов</span><b>${formatPrice(totals.subtotal)} ₾</b></div>
      <div class="summary-line discount-line"><span>Скидка</span><b>− ${formatPrice(totals.discount)} ₾</b></div>
      <div class="summary-total"><span>Итого</span><strong>${formatPrice(totals.total)} <i>₾</i></strong></div>

      <button class="button button-lemon button-large checkout-button" type="button" data-demo-checkout>
        Перейти к оформлению ${icon('arrowRight', 18)}
      </button>
      <p class="summary-disclaimer">Демо-версия: реальная оплата в MVP не подключена.</p>
    </aside>`;
}

function renderEmptyCart(): string {
  return `
    <section class="empty-state">
      <div class="empty-icon">${icon('cart', 26)}</div>
      <h2>Корзина пока пуста</h2>
      <p>Добавьте интересующие объекты из каталога, чтобы собрать нужные контакты в одном месте.</p>
      <button class="button button-dark" type="button" data-page="catalog">Перейти в каталог ${icon('arrowRight', 18)}</button>
    </section>`;
}

export function renderCartPage(data: CartPageData): string {
  const rows = data.items
    .map((line) => {
      const item = data.listings.find((listing) => listing.id === line.id);

      return item ? renderCartRow(item, line.quantity) : '';
    })
    .join('');

  return `
    <main class="page cart-page">
      <section class="page-intro">
        <h1>Корзина</h1>
        <p>${data.totals.itemCount ? `Доступов к контактам: ${data.totals.itemCount}. Проверьте список перед оформлением.` : 'Здесь появятся выбранные объекты.'}</p>
      </section>

      ${
        data.items.length
          ? `<div class="cart-layout">
              <section class="cart-items" aria-label="Выбранные объекты">
                ${rows}
                <button class="continue-link" type="button" data-page="catalog">${icon('arrowLeft', 18)} Продолжить выбор</button>
              </section>
              ${renderSummary(data)}
            </div>`
          : renderEmptyCart()
      }
    </main>`;
}
