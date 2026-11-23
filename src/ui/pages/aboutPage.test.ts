import { describe, expect, it } from 'vitest';

import { renderAboutPage } from './aboutPage';

describe('renderAboutPage', () => {
  it('по умолчанию отображает статистику платформы и обоих членов команды', () => {
    const html = renderAboutPage({ listingsCount: 8, sourcesCount: 4, districtsCount: 5 });

    expect(html).toContain('Val-d-emar');
    expect(html).toContain('gor-anastasii');
    expect(html).toContain('<strong>8</strong>');
    expect(html).toContain('<strong>4</strong>');
    expect(html).toContain('<strong>5</strong>');
  });

  it('экранирует HTML-символы в пользовательских полях участников команды', () => {
    const html = renderAboutPage({ listingsCount: 8, sourcesCount: 4, districtsCount: 5 }, [
      {
        name: '<script>Test</script>',
        login: 'user',
        role: 'Dev',
        contribution: 'A & B',
      },
    ]);

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;Test&lt;/script&gt;');
    expect(html).toContain('A &amp; B');
  });
});
