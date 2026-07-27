import { afterEach, describe, expect, it, vi } from 'vitest';
import { analyzeWithAi, buildFallbackResponse } from './ai';
import { SYSTEM_PROMPT } from './prompt';
import { emptyProfile } from '../src/domain/profile';
import { parseAiReport } from './schema';

const validReport = {
  overallSummary: 'Профиль понятно описывает услугу.',
  mainBarrier: 'Не хватает конкретных доказательств.',
  orderProbability: 'Средняя',
  trustLevel: 'Средний',
  clientPerspectives: ['Быстрый клиент', 'Осторожный клиент', 'Премиум-клиент', 'Неопытный клиент', 'Сравнивающий клиент'].map((label) => ({ label, likes: 'Понятное описание', doubts: 'Мало примеров', reason: 'Нужны доказательства', action: 'Добавить кейс' })),
  topProblems: [1, 2, 3].map((index) => ({ title: `Нет кейсов ${index}`, description: 'Добавьте 2–3 примера работ.' })),
  quickWins: ['Добавить измеримый результат', 'Уточнить срок', 'Показать результат'],
  oneDayFixes: ['Переписать первый экран', 'Добавить один кейс'],
  highImpactFixes: ['Добавить портфолио'],
  improvedHeadline: 'Разрабатываю сайты с понятным результатом',
  improvedDescription: 'Короткое описание услуги и результата.',
  phrasesToRemove: ['Сделаю всё'],
  phrasesToAdd: ['Срок и результат'],
  kworkRecommendations: ['Уточнить состав услуги'],
  portfolioRecommendations: ['Добавить кейсы'],
  pricingRecommendations: ['Показать вилку цены'],
  missingDataWarnings: [],
};

it('accepts a fenced provider response and normalizes English probability labels', () => {
  const normalized = parseAiReport(`\`\`\`json\n${JSON.stringify({ ...validReport, orderProbability: 'Medium' })}\n\`\`\``);
  expect(normalized?.orderProbability).toBe('Средняя');
});

it('trims valid oversized recommendation arrays to the UI limits', () => {
  const normalized = parseAiReport({
    ...validReport,
    highImpactFixes: ['1', '2', '3', '4', '5'],
    phrasesToAdd: ['1', '2', '3', '4', '5', '6'],
    kworkRecommendations: ['1', '2', '3', '4', '5'],
    portfolioRecommendations: ['1', '2', '3', '4', '5'],
    pricingRecommendations: ['1', '2', '3', '4', '5'],
    missingDataWarnings: ['1', '2', '3', '4', '5', '6'],
  });
  expect(normalized?.highImpactFixes).toHaveLength(3);
  expect(normalized?.phrasesToAdd).toHaveLength(5);
  expect(normalized?.kworkRecommendations).toHaveLength(4);
  expect(normalized?.missingDataWarnings).toHaveLength(5);
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.OPENROUTER_API_KEY;
  delete process.env.OPENROUTER_MODEL_LUNA;
  delete process.env.AI_RELAY_URL;
  delete process.env.AI_RELAY_SECRET;
});

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

  it('sends one structured chat request through OpenRouter', async () => {
    process.env.OPENROUTER_API_KEY = 'test-key';
    process.env.OPENROUTER_MODEL_LUNA = 'openai/gpt-5.6-luna';
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(validReport) } }] }), { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await analyzeWithAi({ ...emptyProfile, title: 'Разработчик', description: 'Делаю сайты', goal: 'orders' });

    expect(response.mode).toBe('ai');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer test-key');
    expect(JSON.parse(String(init.body)).model).toBe('openai/gpt-5.6-luna');
    expect(JSON.parse(String(init.body)).response_format.type).toBe('json_schema');
    expect(JSON.parse(String(init.body)).max_tokens).toBe(6000);
  });

  it('falls back when OpenRouter returns an error', async () => {
    process.env.OPENROUTER_API_KEY = 'test-key';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('quota exceeded', { status: 429 })));

    const response = await analyzeWithAi({ ...emptyProfile, title: 'Разработчик', description: 'Делаю сайты', goal: 'orders' });

    expect(response.mode).toBe('basic');
    expect(response.notice).toMatch(/базов/i);
  });

  it('uses the protected relay when relay configuration is present', async () => {
    process.env.OPENROUTER_API_KEY = 'unused-on-vps';
    process.env.AI_RELAY_URL = 'https://relay.example/';
    process.env.AI_RELAY_SECRET = 'relay-secret';
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(validReport) } }] }), { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await analyzeWithAi({ ...emptyProfile, title: 'Р Р°Р·СЂР°Р±РѕС‚С‡РёРє', description: 'Р”РµР»Р°СЋ СЃР°Р№С‚С‹', goal: 'orders' });

    expect(response.mode).toBe('ai');
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://relay.example/ai/analyze');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer relay-secret');
  });

  it('retries a transient relay fetch failure once before falling back', async () => {
    process.env.AI_RELAY_URL = 'https://relay.example/';
    process.env.AI_RELAY_SECRET = 'relay-secret';
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(validReport) } }] }), { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await analyzeWithAi({ ...emptyProfile, title: 'РџСЂРѕС„РёР»СЊ', description: 'РћРїРёСЃР°РЅРёРµ', goal: 'orders' });

    expect(response.mode).toBe('ai');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('retries the relay up to three times when the Render connection fails', async () => {
    process.env.AI_RELAY_URL = 'https://relay.example/';
    process.env.AI_RELAY_SECRET = 'relay-secret';
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(validReport) } }] }), { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await analyzeWithAi({ ...emptyProfile, title: 'Разработчик', description: 'Делаю сайты', goal: 'orders' });

    expect(response.mode).toBe('ai');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('completes a partial paid AI response instead of charging and showing basic mode', async () => {
    process.env.OPENROUTER_API_KEY = 'test-key';
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ overallSummary: 'ok' }) } }] }), { status: 200 })));

    const response = await analyzeWithAi({ ...emptyProfile, title: 'Разработчик', description: 'Делаю сайты', goal: 'orders' });

    expect(response.mode).toBe('ai');
    expect(response.audit.analysisMode).toBe('ai');
    expect(response.audit.clientViews).toHaveLength(5);
    expect(response.audit.issues.length).toBeGreaterThanOrEqual(3);
    expect(errorSpy).not.toHaveBeenCalledWith('[AI] report validation failed', expect.anything());
    errorSpy.mockRestore();
  });
});
