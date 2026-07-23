import { describe, expect, it } from 'vitest';
import { compareProfiles } from './competitive-analysis';
import { emptyProfile } from '../domain/profile';

describe('competitive comparison', () => {
  it('identifies evidence that a competitor has and the user lacks', () => {
    const result = compareProfiles(
      { ...emptyProfile, title: 'Веб-разработчик', description: 'Делаю сайты' },
      [{ ...emptyProfile, name: 'Конкурент', title: 'SaaS-разработчик для B2B', description: '30 проектов, +20% к конверсии', portfolio: 'Кейс: +20% конверсии', reviews: '42 отзыва', completedOrders: 50 }],
    );
    expect(result.actions.join(' ')).toMatch(/кейс|доказатель/i);
    expect(result.competitors[0].strengths.length).toBeGreaterThan(0);
  });
});
