import { escapeHtml } from '../escapeHtml';
import { icon } from '../icons';
import { formatPrice } from './listingCard';
import { SOURCE_LABELS } from '../../data/catalogOptions';
import type { Listing } from '../../types/store';

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
}

function renderGallery(item: Listing): string {
  if (item.images.length === 0) {
    return '<div class="gallery" aria-hidden="true"></div>';
  }

  const slides = item.images
    .map(
      (src, index) => `
        <figure class="gallery-slide">
          <img src="${escapeHtml(src)}" alt="${escapeHtml(item.title)}, фото ${index + 1}"
            ${index === 0 ? '' : 'loading="lazy"'}>
        </figure>`,
    )
    .join('');

  const thumbs = item.images
    .map(
      (src, index) => `
        <button class="gallery-thumb ${index === 0 ? 'is-active' : ''}" type="button"
          data-gallery-goto="${index}" aria-label="Показать фото ${index + 1}">
          <img src="${escapeHtml(src)}" alt="" loading="lazy">
        </button>`,
    )
    .join('');

  const hasMany = item.images.length > 1;

  return `
    <div class="gallery" aria-roledescription="галерея">
      <div class="gallery-stage">
        <div class="gallery-track" data-gallery-track tabindex="0" aria-label="Фотографии объекта">${slides}</div>
        ${
          hasMany
            ? `<button class="gallery-nav gallery-prev" type="button" data-gallery-step="-1" aria-label="Предыдущее фото">${icon('chevronLeft', 22)}</button>
               <button class="gallery-nav gallery-next" type="button" data-gallery-step="1" aria-label="Следующее фото">${icon('chevronRight', 22)}</button>`
            : ''
        }
        <span class="gallery-counter" data-gallery-counter aria-live="polite">1 / ${item.images.length}</span>
      </div>
      ${hasMany ? `<div class="gallery-thumbs">${thumbs}</div>` : ''}
    </div>`;
}

export function renderModalFooter(item: Listing, inCart: boolean): string {
  const id = escapeHtml(item.id);

  const actions = inCart
    ? `<span class="modal-in-cart">${icon('check', 18)} В корзине</span>
       <button class="button button-lemon" type="button" data-page="cart">Открыть корзину ${icon('arrowRight', 18)}</button>`
    : `<button class="button button-dark button-large" type="button" data-add="${id}">${icon('cart', 18)} Добавить в корзину</button>`;

  return `
    <div class="modal-price">
      <small>Доступ к контакту</small>
      <strong>${formatPrice(item.price)} <em>₾</em></strong>
    </div>
    <div class="modal-actions">${actions}</div>`;
}

export function renderListingModal(item: Listing, inCart: boolean): string {
  const specs: Array<[string, string]> = [
    ['Площадь', `${item.area} м²`],
    ['Комнат', String(item.rooms)],
    ['Этаж', `${item.floor} из ${item.totalFloors}`],
    ['Источник', SOURCE_LABELS[item.source]],
    ['Продавец', item.seller],
    ['Опубликовано', formatDate(item.publishedAt)],
  ];

  return `
    <div class="modal-backdrop">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button class="modal-close" type="button" data-modal-close aria-label="Закрыть окно">${icon('close', 22)}</button>

        ${renderGallery(item)}

        <div class="modal-info">
          <div class="modal-body">
            <div class="modal-badges">
              <span class="pill pill-dark">${escapeHtml(SOURCE_LABELS[item.source])}</span>
              ${item.tag ? `<span class="pill pill-lemon">${escapeHtml(item.tag)}</span>` : ''}
              <span class="modal-id">ID ${escapeHtml(item.id)}</span>
            </div>

            <h2 id="modal-title">${escapeHtml(item.title)}</h2>
            <p class="modal-location">${icon('pin', 18)} ${escapeHtml(item.district)}, Батуми</p>

            <dl class="spec-grid">
              ${specs.map(([label, value]) => `<div><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}
            </dl>

            <h3>Об объекте</h3>
            <p class="modal-text">${escapeHtml(item.details)}</p>

            <h3>Особенности</h3>
            <ul class="feature-chips">
              ${item.features.map((feature) => `<li>${icon('check', 16)} ${escapeHtml(feature)}</li>`).join('')}
            </ul>

            <div class="contact-box">
              <span class="contact-icon">${icon('lock', 20)}</span>
              <div>
                <strong>${escapeHtml(item.contactHint)}</strong>
                <small>Полный номер собственника откроется после оплаты доступа.</small>
              </div>
            </div>
          </div>

          <div class="modal-footer" id="modal-footer">${renderModalFooter(item, inCart)}</div>
        </div>
      </div>
    </div>`;
}
