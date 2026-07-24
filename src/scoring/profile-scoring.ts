import type { ClientView, Insight, ProfileAudit, ProfileInput } from '../domain/profile';
import { clientTemplates } from '../data/criteria';
const present = (value: string) => value.trim().length > 0;
const issue = (title: string, description: string): Insight => ({ title, description });
const quality = (value: string, markers: string[], cap: number) => {
  const text = value.toLowerCase();
  if (!present(value)) return 0;
  const lengthPoints = Math.min(cap * 0.45, Math.floor(value.trim().length / 45) * 2);
  const proofPoints = markers.reduce((sum, marker) => sum + (text.includes(marker) ? 1.4 : 0), 0);
  const genericPenalty = /качественно|быстро|индивидуальн|любыми задачами|на связи/.test(text) ? 2.5 : 0;
  return Math.max(1, Math.min(cap, lengthPoints + proofPoints - genericPenalty));
};

export function buildActionPlan(input: ProfileInput) {
  const hasPortfolioEvidence = /кейс|результат|итог|%|рост|сократ/i.test(input.portfolio);
  const hasPriceScope = /входит|состав|правк|этап|вариант|:/.test(input.price.toLowerCase());
  const hasReviewProof = /отзыв|оценк|5[,.]0|заказ/i.test(input.reviews.toLowerCase()) || input.completedOrders > 0;
  const hasClearDescription = input.description.trim().length >= 70;
  const hasClearTitle = input.title.trim().length > 0;
  const fallbackActions = [
    'Обновите лучший кейс свежим измеримым результатом.',
    'Проверьте, что цена соответствует текущему составу работы.',
  ];

  const quickWins = [
    !hasClearTitle && 'Сформулируйте заголовок через специализацию и результат для клиента.',
    !hasClearDescription && 'Добавьте в описание одну строку о результате и процессе работы.',
    !hasPriceScope && 'Рядом с ценой укажите состав работы, этапы и число правок.',
    !hasPortfolioEvidence && 'Вынесите выше один кейс: задача, решение и измеримый итог.',
    !hasReviewProof && 'Добавьте видимые сигналы доверия: отзывы, число заказов или результат кейса.',
  ].filter(Boolean) as string[];
  const tenMinutes = [
    !hasClearTitle && 'Перепишите первую строку через конкретную задачу и результат.',
    !hasClearDescription && 'Добавьте в описание один понятный результат для клиента.',
    !hasPriceScope && 'Уточните состав цены и границы правок.',
    'Проверьте, что первый экран профиля отвечает на вопрос «что вы сделаете».',
  ].filter(Boolean) as string[];
  const oneDay = [
    !hasPortfolioEvidence && 'Соберите два кейса в формате задача → решение → измеримый итог.',
    !hasReviewProof && 'Добавьте отзывы, число завершённых заказов или конкретный результат из кейса.',
    !hasClearDescription && 'Опишите этапы работы и следующий шаг для клиента.',
    'Обновите лучший пример работы свежими деталями и результатом.',
  ].filter(Boolean) as string[];

  return {
    quickWins: (quickWins.length ? quickWins : fallbackActions).slice(0, 5),
    tenMinutes: (tenMinutes.length ? tenMinutes : fallbackActions).slice(0, 3),
    oneDay: (oneDay.length ? oneDay : fallbackActions).slice(0, 3),
    maximumEffect: hasPortfolioEvidence && hasPriceScope
      ? 'Свяжите лучший кейс с услугой и понятным следующим шагом для клиента.'
      : 'Свяжите специализацию, кейс и цену в одном понятном предложении.',
  };
}

export function createProfileAudit(input: ProfileInput, platform = 'Профиль фрилансера'): ProfileAudit {
  const score = Math.round(Math.min(94, 9
    + (present(input.specialization) ? 6 : 0)
    + quality(input.title, ['для', 'b2b', 'saaS', 'рост', 'конверс'], 12)
    + quality(input.description, ['результат', 'задач', 'процесс', 'клиент', 'конверс'], 16)
    + quality(input.services, ['аудит', 'прототип', 'дизайн', 'разработ'], 10)
    + quality(input.price, ['входит', 'правк', 'этап', 'от ', '₽'], 9)
    + Math.min(14, (present(input.reviews) ? quality(input.reviews, ['отзыв', 'оценк', '5.', 'результат'], 7) : 0) + Math.min(7, Math.floor(input.completedOrders / 8)))
    + quality(input.portfolio, ['кейс', 'рост', '%', 'задач', 'итог', 'результат'], 18)));
  const trust = Math.min(100, 14 + (present(input.reviews) ? 27 : 0) + (input.completedOrders > 0 ? 18 : 0) + (present(input.portfolio) ? 24 : 0) + (input.description.length > 70 ? 17 : 0));
  const issues: Insight[] = [];
  if (!present(input.title)) issues.push(issue('Нечёткое первое впечатление', 'Сейчас клиенту может быть сложно понять вашу специализацию в первые секунды.'));
  if (!present(input.description) || input.description.length < 70) issues.push(issue('Описание не объясняет ценность', 'Это снижает уверенность: клиент не видит, какой результат получит и как вы работаете.'));
  if (!present(input.portfolio)) issues.push(issue('Не хватает доказательств результата', 'Портфолио с задачей и итогом помогает выбрать вас без лишних сомнений.'));
  if (!present(input.reviews) && input.completedOrders === 0) issues.push(issue('Мало сигналов доверия', 'Без отзывов, заказов или кейсов осторожному клиенту сложнее оценить риск.'));
  if (!present(input.price)) issues.push(issue('Цена не привязана к составу работы', 'Клиенту трудно сравнить предложение и понять, что входит в стоимость.'));
  if (!present(input.services)) issues.push(issue('Услуги не структурированы', 'Лучше показать 2–3 понятных сценария, с которыми вы помогаете.'));
  const fallback = issue('Профиль можно сделать более конкретным', 'Выберите один сильный результат и покажите его на первом экране.');
  while (issues.length < 5) issues.push(fallback);
  const clientViews: ClientView[] = clientTemplates.map(([label, likes, doubts, reason, action]) => ({ label, likes: present(input.title) ? likes : 'желание быстро разобраться в задаче', doubts: !present(input.portfolio) ? doubts : 'хочет увидеть ещё один похожий кейс', reason, action }));
  const role = input.specialization || 'специалист';
  const audience = input.extra || 'клиентов с понятной задачей';
  const serviceFocus = input.services.split(/[,;\n]/)[0]?.trim();
  const improvements = {
    headline: serviceFocus ? `${role}: ${serviceFocus} для ${audience} — понятный результат без лишних итераций` : `${role}: понятный результат для ${audience} без лишних итераций`,
    description: `В работе над ${serviceFocus || 'задачей'} сначала уточняю задачу и критерии результата, затем показываю понятный план и держу вас в курсе на каждом этапе. В конце вы получаете готовый результат и материалы для дальнейшей работы.`,
    remove: ['«Качественно и быстро» без примера', '«Индивидуальный подход» без описания процесса', 'Длинный список навыков без результата'],
    add: ['С каким типом задач вы работаете', 'Какой результат получает клиент', 'Один кейс в формате задача → действие → итог'],
    portfolio: 'Добавьте 2–3 кейса: исходная задача, ваше решение, скриншот или ссылка, измеримый итог.',
    price: 'Рядом с ценой укажите состав: что входит, сколько вариантов и как устроены правки.',
    structure: 'Разделите услуги на «Быстрый старт», «Основная работа» и «Поддержка / доработка».',
    before: input.title || 'Делаю качественно и недорого', after: `${role}: конкретный результат для ${audience}`,
  };
  const categories = [['Первое впечатление', present(input.title)], ['Доверие', present(input.reviews) || input.completedOrders > 0], ['Позиционирование', present(input.specialization)], ['Оффер', present(input.services)], ['Заголовок', present(input.title)], ['Описание', input.description.length > 70], ['Кворки', present(input.services)], ['Портфолио', present(input.portfolio)], ['Отзывы', present(input.reviews)], ['Цена', present(input.price)], ['Риски для клиента', present(input.portfolio) && (present(input.reviews) || input.completedOrders > 0)], ['Вероятность заказа', score >= 55]].map(([name, good]) => ({ name: String(name), score: good ? Math.min(92, score + 9) : Math.max(24, score - 16), status: (good ? 'Хорошо' : score >= 55 ? 'Средне' : 'Требует внимания') as 'Хорошо' | 'Средне' | 'Требует внимания', explanation: good ? 'В профиле уже есть понятный сигнал для клиента.' : 'Клиенту может быть сложно оценить этот элемент профиля.', recommendation: good ? 'Сохраните конкретику и добавьте один свежий пример.' : 'Добавьте конкретный результат и объясните, что получает клиент.', example: good ? 'Покажите один кейс с задачей и итогом.' : 'Формула: задача → ваш подход → измеримый результат.' }));
  return {
    platform,
    score,
    trust,
    likelihood: score >= 75 ? 'Высокая' : score >= 50 ? 'Средняя' : 'Низкая',
    barrier: issues[0],
    issues: issues.slice(0, 5),
    ...buildActionPlan(input),
    clientViews,
    improvements,
    categories: categories.map((category) => category.name === 'Кворки' ? { ...category, name: 'Услуги' } : category),
  };
}
