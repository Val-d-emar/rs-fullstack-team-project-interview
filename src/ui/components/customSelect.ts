import { escapeHtml } from '../escapeHtml';
import { icon } from '../icons';
import type { SelectOption } from '../../types/store';

export interface CustomSelectProps {
  id: string;
  label: string;
  options: readonly SelectOption[];
  value: string;
  isOpen: boolean;
}

export function renderCustomSelect(props: CustomSelectProps): string {
  const { id, label, options, value, isOpen } = props;
  const selected = options.find((option) => option.value === value) ?? options[0];

  if (!selected) return '';

  const items = options
    .map((option) => {
      const isSelected = option.value === selected.value;

      return `
        <li role="presentation">
          <button class="select-option ${isSelected ? 'is-selected' : ''}" type="button" role="option"
            aria-selected="${isSelected}" data-select-option="${escapeHtml(id)}"
            data-value="${escapeHtml(option.value)}">
            <span>${escapeHtml(option.label)}</span>
            ${isSelected ? icon('check', 18) : ''}
          </button>
        </li>`;
    })
    .join('');

  return `
    <div class="field custom-select ${isOpen ? 'is-open' : ''}" data-select="${escapeHtml(id)}">
      <span class="field-label" id="${escapeHtml(id)}-label">${escapeHtml(label)}</span>
      <button class="select-trigger" id="${escapeHtml(id)}-trigger" type="button"
        data-select-toggle="${escapeHtml(id)}" aria-haspopup="listbox" aria-expanded="${isOpen}"
        aria-labelledby="${escapeHtml(id)}-label ${escapeHtml(id)}-trigger">
        <span class="select-value">${escapeHtml(selected.label)}</span>
        ${icon('chevronDown', 20)}
      </button>
      ${
        isOpen
          ? `<ul class="select-menu" role="listbox" aria-labelledby="${escapeHtml(id)}-label">${items}</ul>`
          : ''
      }
    </div>`;
}
