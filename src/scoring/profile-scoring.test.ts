import { describe, expect, it } from 'vitest';
import { createProfileAudit } from './profile-scoring';

const sparseProfile = {
  name: '',
  specialization: '',
  title: '',
  description: '',
  services: '',
  price: '',
  reviews: '',
  completedOrders: 0,
  portfolio: '',
  profileUrl: '',
  extra: '',
  goal: 'orders' as const,
};

describe('createProfileAudit', () => {
  it('explains the lack of trust signals on a sparse profile', () => {
    const audit = createProfileAudit(sparseProfile, 'Kwork');
    expect(audit.issues.some((issue) => /довер/i.test(issue.title))).toBe(true);
  });

  it('scores a documented profile above a sparse one', () => {
    const detailedProfile = {
      ...sparseProfile,
      name: 'Анна',
      specialization: 'UX/UI-дизайн',
      title: 'UX/UI-дизайнер SaaS для B2B-команд',
      description: 'Проектирую понятные интерфейсы для B2B-продуктов и показываю, как дизайн влияет на путь пользователя.',
      services: 'UX-аудит, прототипирование, UI-дизайн',
      price: 'от 25 000 ₽ с понятным составом работ',
      reviews: '47 отзывов, средняя оценка 5.0',
      completedOrders: 64,
      portfolio: '3 кейса: рост конверсии, уменьшение ошибок, запуск B2B-сервиса',
    };
    expect(createProfileAudit(detailedProfile, 'Kwork').score)
      .toBeGreaterThan(createProfileAudit(sparseProfile, 'Kwork').score);
  });

  it('does not give the same top score to generic and evidence-based profiles', () => {
    const generic = { ...sparseProfile, title: 'Дизайнер', description: 'Делаю качественно и быстро. Индивидуальный подход. Работаю с любыми задачами и всегда на связи.', services: 'Дизайн', price: 'от 5000', reviews: 'Отзывы есть', completedOrders: 1, portfolio: 'Работы есть' };
    const evidenceBased = { ...generic, title: 'UX/UI-дизайнер B2B SaaS: сокращаю путь до заявки', description: 'Проектирую интерфейсы SaaS для B2B-команд: исследую сценарии, собираю прототип и показываю измеримый эффект в конверсии или скорости работы.', services: 'UX-аудит, прототипирование, дизайн интерфейса', price: 'от 35 000 ₽: аудит, прототип, UI-kit и 2 раунда правок', reviews: '47 отзывов, 5.0, отмечают предсказуемый процесс', completedOrders: 64, portfolio: 'Кейс SaaS: рост завершения заявки на 18%; B2B-кабинет: сокращение ошибок на 24%' };
    expect(createProfileAudit(evidenceBased, 'Kwork').score).toBeGreaterThan(createProfileAudit(generic, 'Kwork').score);
    expect(createProfileAudit(generic, 'Kwork').score).toBeLessThan(90);
  });

  it('builds a grammatically correct fallback improvement from profile details', () => {
    const audit = createProfileAudit({
      ...sparseProfile,
      specialization: 'Разработчик сайтов',
      services: 'Лендинги, Telegram-боты',
      extra: '',
    }, 'Kwork');

    expect(audit.improvements.headline).not.toContain('помогаю клиентов');
    expect(audit.improvements.headline).toContain('Разработчик сайтов');
    expect(audit.improvements.description).toContain('Лендинги');
  });
});
