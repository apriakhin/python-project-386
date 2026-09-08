import "./App.css";

function App() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-content">
          <a className="brand" href="#" aria-label="Calendar">
            <svg
              aria-hidden="true"
              className="brand-icon"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M8 3v3m8-3v3M4.5 9.5h15M6.5 5.5h11a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-10a2 2 0 0 1 2-2Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 13.25v2.5l1.75 1"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Calendar</span>
          </a>
          <nav aria-label="Основная навигация">
            <a href="#">Записаться</a>
            <a href="#">Предстоящие события</a>
          </nav>
        </div>
      </header>

      <main className="hero">
        <div className="hero-content">
          <section className="hero-copy" aria-labelledby="page-title">
            <p className="eyebrow">БЫСТРАЯ ЗАПИСЬ НА ЗВОНОК</p>
            <h1 id="page-title">Calendar</h1>
            <p className="intro">
              Один экран, понятные слоты, быстрая бронь. Выберите время и
              запишитесь на звонок без лишних шагов.
            </p>
            <a className="primary-action" href="#">
              Записаться
              <span aria-hidden="true">→</span>
            </a>
          </section>

          <section
            className="availability"
            aria-labelledby="availability-title"
          >
            <h2 id="availability-title">Что доступно прямо сейчас</h2>
            <ul>
              <li>Фиксированные 30-минутные слоты с 09:00 до 18:00.</li>
              <li>Проверка конфликта при бронировании.</li>
              <li>Просмотр предстоящих событий в отдельном разделе.</li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
