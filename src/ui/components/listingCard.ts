import { escapeHtml } from '../escapeHtml';
import { icon } from '../icons';
import { SOURCE_LABELS } from '../../data/catalogOptions';
import type { Listing } from '../../types/store';

export function formatPrice(value: number): string {
  return value.toLocaleString('ru-RU');
}

export function renderListingCard(item: Listing, inCart: boolean): string {
  const cover = item.images[0];
  const id = escapeHtml(item.id);

  const action = inCart
    ? `<button class="button button-added" type="button" data-page="cart">${icon('check', 18)} В корзине</button>`
    : `<button class="button button-dark" type="button" data-add="${id}">${icon('cart', 18)} В корзину</button>`;

  return `
    <article class="listing-card" data-open="${id}">
      <div class="listing-image-wrap">
        ${cover ? `<img class="listing-image" src="${escapeHtml(cover)}" alt="${escapeHtml(item.title)}" loading="lazy" onerror="this.remove()">` : ''}
        <span class="pill pill-dark">${escapeHtml(SOURCE_LABELS[item.source])}</span>
        ${item.tag ? `<span class="pill pill-lemon pill-right">${escapeHtml(item.tag)}</span>` : ''}
        <span class="photo-count">${icon('camera', 16)} ${item.images.length}</span>
      </div>

      <div class="listing-content">
        <div class="listing-location">
          ${icon('pin', 16)} ${escapeHtml(item.district)}
          <span class="listing-id">ID ${id}</span>
        </div>

        <h3><button class="listing-title" type="button" data-open="${id}">${escapeHtml(item.title)}</button></h3>
        <p class="listing-description">${escapeHtml(item.description)}</p>

        <ul class="listing-specs">
          <li>${icon('area', 16)} <b>${item.area}</b> м²</li>
          <li>${icon('rooms', 16)} <b>${item.rooms}</b> комн.</li>
          <li>${icon('floor', 16)} <b>${item.floor}</b>/${item.totalFloors} эт.</li>
        </ul>

        <div class="listing-footer">
          <div class="access-price">
            <small>Доступ к контакту</small>
            <strong>${formatPrice(item.price)} <em>₾</em></strong>
          </div>
          ${action}
        </div>
      </div>
    </article>`;
}
