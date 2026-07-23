import { describe, expect, it } from 'vitest';
import { buildFallbackResponse } from './ai';

describe('buildFallbackResponse', () => {
  it('returns a useful basic report when the API key is unavailable', () => {
    const response = buildFallbackResponse({ title: 'Дизайнер', description: 'Помогаю запустить понятный сайт.', completedOrders: 0, goal: 'orders' }, 'AI-анализ пока недоступен.');
    expect(response.mode).toBe('basic');
    expect(response.audit.score).toBeGreaterThan(0);
    expect(response.notice).toMatch(/недоступен/i);
  });
});
