import { describe, expect, it } from 'vitest';
import { buildFallbackResponse } from './ai';
import { SYSTEM_PROMPT } from './prompt';

describe('buildFallbackResponse', () => {
  it('does not use Kwork-only wording in the system prompt', () => {
    expect(SYSTEM_PROMPT).not.toMatch(/аналитик Kwork-профилей/i);
  });

  it('keeps the collected marketplace in a local fallback report', () => {
    const response = buildFallbackResponse({ title: 'UX-аудит', goal: 'orders' }, 'Базовый анализ', 'FL.ru');
    expect(response.audit.platform).toBe('FL.ru');
  });

  it('returns a useful basic report when the API key is unavailable', () => {
    const response = buildFallbackResponse({ title: 'Дизайнер', description: 'Помогаю запустить понятный сайт.', completedOrders: 0, goal: 'orders' }, 'AI-анализ пока недоступен.');
    expect(response.mode).toBe('basic');
    expect(response.audit.score).toBeGreaterThan(0);
    expect(response.notice).toMatch(/недоступен/i);
  });
});
