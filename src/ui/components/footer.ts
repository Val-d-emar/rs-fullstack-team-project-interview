const RS_SCHOOL_URL = 'https://rs.school';

const RS_SCHOOL_BADGE = `
  <svg width="88" height="32" viewBox="0 0 88 32" fill="none" aria-hidden="true">
    <rect x="1" y="1" width="86" height="30" rx="6" fill="#101d36"/>
    <text x="44" y="21" text-anchor="middle" fill="#eef5ae"
      font-family="Manrope, Arial, sans-serif" font-size="13" font-weight="800" letter-spacing="0.5">
      RS SCHOOL
    </text>
  </svg>`;

export function renderFooter(): string {
  return `
    <footer class="site-footer">
      <div class="footer-inner">
        <div class="footer-brand-block">
          <a class="brand" href="#" data-page="about" aria-label="BatumiLeads — на главную">
            <span class="brand-mark" aria-hidden="true"><span></span><span></span><span></span></span>
            <span class="brand-name">Batumi<span>Leads</span></span>
          </a>
          <p>Витрина проверенных контактов собственников недвижимости Батуми для риелторов.</p>
        </div>

        <nav class="footer-column" aria-label="Разделы сайта">
          <h2>Разделы</h2>
          <button type="button" data-page="about">О платформе</button>
          <button type="button" data-page="catalog">Каталог</button>
          <button type="button" data-page="cart">Корзина</button>
        </nav>

        <div class="footer-column">
          <h2>Источники</h2>
          <a href="https://ss.ge" target="_blank" rel="noreferrer">ss.ge</a>
          <a href="https://korter.ge" target="_blank" rel="noreferrer">korter.ge</a>
          <a href="https://www.facebook.com" target="_blank" rel="noreferrer">Facebook</a>
        </div>

        <div class="footer-column footer-partner">
          <h2>Учебный проект</h2>
          <a class="partner-logo" href="${RS_SCHOOL_URL}" target="_blank" rel="noreferrer"
            aria-label="RS School — открыть сайт курса">
            ${RS_SCHOOL_BADGE}
          </a>
          <p>Сделан в рамках курса RS School.</p>
        </div>
      </div>

      <div class="footer-bottom">
        <span>© 2026 BatumiLeads</span>
        <span>Демо-версия: оплата не подключена, данные тестовые</span>
      </div>
    </footer>`;
}
