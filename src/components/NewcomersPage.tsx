import { useState } from 'react';
import { newcomerGuides } from '../data/newcomer-guides';

export function NewcomersPage({ onAnalyze }: { onAnalyze: () => void }) {
  const [selectedGuideId, setSelectedGuideId] = useState(newcomerGuides[0].id);
  const selectedGuide = newcomerGuides.find((guide) => guide.id === selectedGuideId) ?? newcomerGuides[0];

  return (
    <section className="newcomers-page">
      <header className="newcomers-head">
        <p className="eyebrow">Материалы для старта</p>
        <h1>Как сделать профиль понятнее для первого клиента</h1>
        <p>Пять практических разборов для фрилансеров, у которых пока мало заказов или нет отзывов. Без обещаний быстрого результата — только конкретные действия.</p>
      </header>

      <div className="newcomers-grid" aria-label="Материалы для новичков">
        {newcomerGuides.map((guide) => {
          const isSelected = guide.id === selectedGuide.id;
          return (
            <article className={isSelected ? 'newcomer-card selected' : 'newcomer-card'} key={guide.id}>
              <span>{isSelected ? 'Открыт материал' : 'Практический разбор'}</span>
              <strong>{guide.title}</strong>
              <p>{guide.summary}</p>
              <button type="button" className="text-button" onClick={() => setSelectedGuideId(guide.id)}>
                Открыть материал
              </button>
            </article>
          );
        })}
      </div>

      <article className="newcomer-detail">
        <div className="newcomer-detail-head">
          <p className="eyebrow">Выбранный материал</p>
          <h2>{selectedGuide.title}</h2>
        </div>

        <section className="newcomer-section">
          <h3>В чём проблема</h3>
          <p>{selectedGuide.problem}</p>
        </section>

        <section className="newcomer-section">
          <h3>Что можно исправить</h3>
          <ol>
            {selectedGuide.fixes.map((fix) => <li key={fix}>{fix}</li>)}
          </ol>
        </section>

        {selectedGuide.example ? (
          <section className="newcomer-example" aria-label="Пример формулировки">
            <div><span>Плохо</span><p>{selectedGuide.example.before}</p></div>
            <div><span>Лучше</span><p>{selectedGuide.example.after}</p></div>
          </section>
        ) : null}

        <section className="newcomer-section newcomer-checklist">
          <h3>Короткий чек-лист</h3>
          <ul>
            {selectedGuide.checklist.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>

        <button type="button" className="primary newcomer-cta" onClick={onAnalyze}>Перейти к анализу</button>
      </article>
    </section>
  );
}
