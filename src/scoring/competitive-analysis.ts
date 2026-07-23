import type { CompetitiveComparison, ProfileInput } from '../domain/profile';

const evidence = (profile: ProfileInput) => ({
  positioning: /для|b2b|saas|интернет-магазин|telegram|crm/i.test(`${profile.title} ${profile.description}`),
  proof: /\d+%|\d+ проект|кейс|результат|конверс/i.test(`${profile.description} ${profile.portfolio}`),
  social: profile.completedOrders > 0 || /\d+\s*(отзыв|заказ)/i.test(profile.reviews),
  price: profile.price.trim().length > 12,
  portfolio: profile.portfolio.trim().length > 20,
});

const labels: Record<keyof ReturnType<typeof evidence>, string> = { positioning: 'сфокусированное позиционирование', proof: 'конкретные доказательства результата', social: 'социальное доказательство', price: 'понятная цена и состав', portfolio: 'портфолио с деталями' };

export function compareProfiles(user: ProfileInput, competitors: ProfileInput[]): CompetitiveComparison {
  const userEvidence = evidence(user);
  const rows = competitors.map((competitor) => {
    const peer = evidence(competitor);
    const strengths = (Object.keys(peer) as (keyof typeof peer)[]).filter((key) => peer[key] && !userEvidence[key]).map((key) => labels[key]);
    const userAdvantages = (Object.keys(peer) as (keyof typeof peer)[]).filter((key) => userEvidence[key] && !peer[key]).map((key) => labels[key]);
    return { name: competitor.name || competitor.title || 'Конкурент', strengths, userAdvantages };
  });
  const missing = new Set(rows.flatMap((row) => row.strengths));
  const actions = [...missing].slice(0, 4).map((item) => item === labels.proof ? 'Добавьте 2–3 кейса с задачей, вашей ролью и измеримым результатом.' : `Усильте профиль: ${item}.`);
  return { competitors: rows, actions: actions.length ? actions : ['Сохраните сильные стороны профиля и сделайте их заметными в заголовке и первых строках описания.'] };
}
