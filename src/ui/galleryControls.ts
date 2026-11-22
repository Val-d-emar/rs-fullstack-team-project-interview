const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function getTrack(root: ParentNode): HTMLElement | null {
  return root.querySelector<HTMLElement>('[data-gallery-track]');
}

export function getCurrentIndex(root: ParentNode): number {
  const track = getTrack(root);

  if (!track || track.clientWidth === 0) return 0;

  return Math.round(track.scrollLeft / track.clientWidth);
}

export function goToSlide(root: ParentNode, index: number): void {
  const track = getTrack(root);

  if (!track) return;

  const lastIndex = track.children.length - 1;
  const safeIndex = Math.min(Math.max(index, 0), lastIndex);

  track.scrollTo({
    left: safeIndex * track.clientWidth,
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
  });
}

/** Обновляет счётчик «2 / 5» и активную миниатюру по текущей позиции прокрутки */
export function syncGallery(root: ParentNode): void {
  const track = getTrack(root);

  if (!track) return;

  const index = getCurrentIndex(root);
  const counter = root.querySelector<HTMLElement>('[data-gallery-counter]');

  if (counter) counter.textContent = `${index + 1} / ${track.children.length}`;

  root.querySelectorAll<HTMLElement>('[data-gallery-goto]').forEach((thumb) => {
    const isActive = Number(thumb.dataset.galleryGoto) === index;

    thumb.classList.toggle('is-active', isActive);

    if (isActive) {
      thumb.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'auto' });
    }
  });
}
