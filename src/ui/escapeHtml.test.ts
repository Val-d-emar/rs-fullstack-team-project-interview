import { describe, expect, it } from 'vitest';

import { escapeHtml } from './escapeHtml';

describe('escapeHtml', () => {
  it('экранирует опасные HTML-символы', () => {
    expect(escapeHtml('<script>alert("xss" & \'test\')</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot; &amp; &#39;test&#39;)&lt;/script&gt;',
    );
  });

  it('безопасно обрабатывает null и числовые значения', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
    expect(escapeHtml(42)).toBe('42');
  });
});
