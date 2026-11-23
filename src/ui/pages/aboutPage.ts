import { escapeHtml } from '../escapeHtml';
import { icon } from '../icons';

export interface TeamMember {
  name: string;
  login: string;
  role: string;
  contribution: string;
}

export interface AboutStats {
  listingsCount: number;
  sourcesCount: number;
  districtsCount: number;
}

const DEFAULT_TEAM: TeamMember[] = [
  {
    name: 'Владимир',
    login: 'Val-d-emar',
    role: 'Frontend и архитектура',
    contribution: 'Инфраструктура, архитектура приложения, хранилище состояния и базовый каркас.',
  },
  {
    name: 'Анастасия',
    login: 'gor-anastasii',
    role: 'Frontend и UI/бизнес-логика',
    contribution: 'Дизайн-система, каталог с фильтрами, корзина, промокоды и тестирование.',
  },
];

const STEPS = [
  {
    title: 'Найдите объект',
    text: 'Предложения из разных источников собраны в одном каталоге с поиском по названию, району и ID.',
  },
  {
    title: 'Отфильтруйте по бюджету',
    text: 'Выберите район и диапазон цены доступа, отсортируйте результаты — и останутся только подходящие лиды.',
  },
  {
    title: 'Соберите контакты в корзину',
    text: 'Добавляйте нужные доступы, применяйте промокод и проверяйте итоговую сумму перед оформлением.',
  },
];

const SOURCES = ['ss.ge', 'korter.ge', 'Facebook', 'Ручной ввод'];

function renderTeamCard(member: TeamMember): string {
  return `
    <article class="team-card">
      <div class="team-avatar" aria-hidden="true">${escapeHtml(member.name.charAt(0))}</div>
      <div class="team-role">${escapeHtml(member.role)}</div>
      <h3>${escapeHtml(member.name)}</h3>
      <a href="https://github.com/${encodeURIComponent(member.login)}" target="_blank" rel="noreferrer">
        @${escapeHtml(member.login)} ${icon('external', 14)}
      </a>
      <p>${escapeHtml(member.contribution)}</p>
    </article>`;
}

export function renderAboutPage(stats: AboutStats, team: TeamMember[] = DEFAULT_TEAM): string {
  return `
    <main class="page about-page">
      <section class="hero">
        <div class="hero-copy">
          <h1>Правильные контакты. <span class="mark">Больше сделок.</span></h1>
          <p class="hero-text">Проверенные контакты собственников недвижимости Батуми — в одном месте. Находите перспективные объекты и тратьте время на сделки, а не на поиск.</p>
          <div class="hero-actions">
            <button class="button button-lemon button-large" type="button" data-page="catalog">
              Перейти в каталог ${icon('arrowRight', 18)}
            </button>
            <a class="text-link" href="#how-it-works">Как это работает</a>
          </div>
        </div>

        <div class="hero-visual">
          <img src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80"
            alt="Современная квартира в Батуми">
          <div class="hero-image-label">
            <span class="status-dot"></span>
            <span><b>Батуми, Грузия</b><small>Подборка объектов от собственников</small></span>
          </div>
          <div class="floating-note">
            <span class="floating-icon">${icon('shield', 20)}</span>
            <span><b>Проверенные лиды</b><small>Контакты собраны из ${stats.sourcesCount} источников</small></span>
          </div>
        </div>
      </section>

      <section class="metrics-strip" aria-label="Платформа в цифрах">
        <div><strong>${stats.listingsCount}</strong><span>объектов в каталоге</span></div>
        <div><strong>${stats.sourcesCount}</strong><span>источника объявлений</span></div>
        <div><strong>${stats.districtsCount}</strong><span>районов Батуми</span></div>
      </section>

      <section class="section-block" id="how-it-works">
        <div class="section-heading">
          <h2>Поиск возможностей без лишнего шума</h2>
          <p>Мы собираем предложения из нескольких источников и превращаем их в понятный каталог для ежедневной работы риелтора.</p>
        </div>
        <div class="feature-grid">
          ${STEPS.map(
            (step, index) => `
            <article class="feature-card ${index === 1 ? 'feature-card-dark' : ''}">
              <span class="step-badge">${index + 1}</span>
              <h3>${escapeHtml(step.title)}</h3>
              <p>${escapeHtml(step.text)}</p>
            </article>`,
          ).join('')}
        </div>
      </section>

      <section class="sources-band">
        <h2>Разные источники. Одна точка входа.</h2>
        <ul class="source-chips">${SOURCES.map((source) => `<li>${escapeHtml(source)}</li>`).join('')}</ul>
      </section>

      <section class="section-block team-section">
        <div class="section-heading">
          <h2>Создано командой, которая любит детали</h2>
          <p>Два участника, одна цель — сделать поиск недвижимости в Батуми удобнее.</p>
        </div>
        <div class="team-grid">${team.map(renderTeamCard).join('')}</div>
      </section>

      <section class="closing-cta">
        <h2>Следующая сделка может быть здесь</h2>
        <button class="button button-lemon button-large" type="button" data-page="catalog">
          Открыть каталог ${icon('arrowRight', 18)}
        </button>
      </section>
    </main>`;
}
