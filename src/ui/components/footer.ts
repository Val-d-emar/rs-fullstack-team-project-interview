const RS_SCHOOL_URL = 'https://rs.school';

import RS_SCHOOL_BADGE from '../../assets/rs-school-logo.svg?raw';

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
          <p>Сделан в рамках курса JS FullStack.</p>
        </div>
      </div>

      <div class="footer-bottom">
        <span>© 2026 BatumiLeads</span>
        <span>Демо-версия: оплата не подключена, данные тестовые</span>
      </div>
    </footer>`;
}
