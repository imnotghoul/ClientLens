import { emptyProfile, type ProfileAudit, type ProfileInput } from '../src/domain/profile';
import { createProfileAudit } from '../src/scoring/profile-scoring';
import { SYSTEM_PROMPT } from './prompt';
import { AI_JSON_SCHEMA, parseAiReport, type AiReport } from './schema';

export type AnalysisResponse = { audit: ProfileAudit; mode: 'ai' | 'basic'; notice?: string };
type AnalyzeOptions = { model?: 'gpt-5.6-luna' | 'gpt-5.6-terra' | 'gpt-5.6-sol'; platform?: string };

// Output caps are deliberately model-specific. They leave enough room for the
// complete structured report while keeping the expensive Opus tier bounded.
// These are output tokens; input tokens are billed separately by the provider.
export const AI_OUTPUT_TOKEN_BUDGETS = {
  'gpt-5.6-luna': 12000,
  'gpt-5.6-terra': 10000,
  'gpt-5.6-sol': 9000,
} as const;

const outputTokenBudget = (model?: AnalyzeOptions['model']): number =>
  AI_OUTPUT_TOKEN_BUDGETS[model ?? 'gpt-5.6-luna'];

const resolveOpenRouterModel = (model?: AnalyzeOptions['model']): string => {
  if (model === 'gpt-5.6-terra') return process.env.OPENROUTER_MODEL_TERRA || 'openai/gpt-5.6-terra';
  if (model === 'gpt-5.6-sol') return process.env.OPENROUTER_MODEL_SOL || 'openai/gpt-5.6-sol';
  return process.env.OPENROUTER_MODEL_LUNA || 'openai/gpt-5.6-luna';
};

const completeProfile = (partial: Partial<ProfileInput>): ProfileInput => ({ ...emptyProfile, ...partial });

const asText = (value: unknown, fallback: string): string => typeof value === 'string' && value.trim() ? value.trim() : fallback;
const asList = (value: unknown, fallback: string[], min: number): string[] => {
  const list = Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim()).map((item) => item.trim()) : [];
  return list.length >= min ? list : [...list, ...fallback].slice(0, Math.max(min, list.length));
};

const completeAiPayload = (value: unknown, local: ProfileAudit): Partial<AiReport> => {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const isTextValue = (item: unknown): item is string => typeof item === 'string' && item.trim().length > 0;
  const perspectives = Array.isArray(source.clientPerspectives)
    ? source.clientPerspectives
      .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object' && !Array.isArray(item)))
      .map((item) => ({
        label: isTextValue(item.label) ? item.label.trim().slice(0, 80) : '',
        likes: isTextValue(item.likes) ? item.likes.trim().slice(0, 500) : '',
        doubts: isTextValue(item.doubts) ? item.doubts.trim().slice(0, 500) : '',
        reason: isTextValue(item.reason) ? item.reason.trim().slice(0, 500) : '',
        action: isTextValue(item.action) ? item.action.trim().slice(0, 500) : '',
      }))
      .filter((item) => Object.values(item).every(isTextValue))
    : [];
  const validProblems = Array.isArray(source.topProblems)
    ? source.topProblems
      .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object' && !Array.isArray(item)))
      .map((item) => ({ title: isTextValue(item.title) ? item.title.trim().slice(0, 120) : '', description: isTextValue(item.description) ? item.description.trim().slice(0, 500) : '' }))
      .filter((item) => isTextValue(item.title) && isTextValue(item.description))
    : [];
  const fallbackPerspectives = local.clientViews.length ? local.clientViews : [{ label: 'Клиент', likes: 'Видит профиль', doubts: 'Нужны дополнительные доказательства', reason: 'Сравнивает варианты', action: 'Задаёт уточняющий вопрос' }];
  const completePerspectives = [...perspectives, ...fallbackPerspectives];
  while (completePerspectives.length < 5) completePerspectives.push(fallbackPerspectives[completePerspectives.length % fallbackPerspectives.length]);
  // A provider may return an English label (or an unexpected value) even
  // when the JSON shape is otherwise usable. Keep the report valid rather
  // than discarding the whole paid response because of one enum field.
  const orderProbability: AiReport['orderProbability'] = local.likelihood;
  return {
    overallSummary: asText(source.overallSummary, local.barrier.description),
    mainBarrier: asText(source.mainBarrier, local.barrier.title),
    orderProbability,
    trustLevel: asText(source.trustLevel, `Уровень доверия: ${local.trust}/100`),
    clientPerspectives: completePerspectives.slice(0, 5),
    topProblems: validProblems.length >= 3 ? validProblems.slice(0, 5) : local.issues.slice(0, 5),
    quickWins: asList(source.quickWins, local.quickWins, 3), oneDayFixes: asList(source.oneDayFixes, local.oneDay, 2), highImpactFixes: asList(source.highImpactFixes, [local.maximumEffect], 1),
    improvedHeadline: asText(source.improvedHeadline, local.improvements.headline), improvedDescription: asText(source.improvedDescription, local.improvements.description),
    phrasesToRemove: asList(source.phrasesToRemove, local.improvements.remove, 0), phrasesToAdd: asList(source.phrasesToAdd, local.improvements.add, 0),
    kworkRecommendations: asList(source.kworkRecommendations, [local.improvements.structure], 1), portfolioRecommendations: asList(source.portfolioRecommendations, [local.improvements.portfolio], 1), pricingRecommendations: asList(source.pricingRecommendations, [local.improvements.price], 1), missingDataWarnings: asList(source.missingDataWarnings, [], 0),
  };
};
export const buildFallbackResponse = (partial: Partial<ProfileInput>, notice: string, platform = 'Профиль фрилансера'): AnalysisResponse => ({ audit: { ...createProfileAudit(completeProfile(partial), platform), analysisMode: 'basic', analysisSummary: notice }, mode: 'basic', notice });

/** OpenRouter providers can return parsed JSON, a string, or an array of text parts. */
const extractProviderContent = (payload: unknown): unknown => {
  if (!payload || typeof payload !== 'object') return null;
  const choice = (payload as { choices?: unknown[] }).choices?.[0];
  if (!choice || typeof choice !== 'object') return null;
  const message = (choice as { message?: unknown }).message;
  if (!message || typeof message !== 'object') return null;
  const record = message as { parsed?: unknown; content?: unknown };
  if (record.parsed && typeof record.parsed === 'object') return record.parsed;
  if (Array.isArray(record.content)) {
    return record.content.map((part) => part && typeof part === 'object' && typeof (part as { text?: unknown }).text === 'string' ? (part as { text: string }).text : '').join('').trim();
  }
  return record.content ?? null;
};

/** Guarantees a complete paid report even when a provider truncates or omits fields. */
const guaranteedAiReport = (local: ProfileAudit): AiReport => {
  const fallbackView = { label: 'Client', likes: 'Sees a clear service', doubts: 'Needs stronger proof of results', reason: 'Compares several freelancers', action: 'Asks a clarifying question' };
  const views = local.clientViews.length ? local.clientViews : [fallbackView];
  const fallbackProblem = { title: local.barrier.title || 'The profile needs more clarity', description: local.barrier.description || 'Show a concrete result and a clear next step for the client.' };
  const problems = local.issues.length ? local.issues : [fallbackProblem];
  const list = (value: unknown, fallback: string[], min: number): string[] => asList(value, fallback, min);
  return {
    overallSummary: local.analysisSummary || local.barrier.description || 'The profile can be made clearer and more convincing for clients.',
    mainBarrier: local.barrier.title || 'The promised result is not clear enough',
    orderProbability: local.likelihood,
    trustLevel: local.trustLabel || `Trust level: ${local.trust}/100`,
    clientPerspectives: Array.from({ length: 5 }, (_, index) => views[index % views.length]),
    topProblems: Array.from({ length: 3 }, (_, index) => problems[index % problems.length]),
    quickWins: list(local.quickWins, ['Clarify the result of the service', 'Add one concrete case', 'Make the first screen more specific'], 3),
    oneDayFixes: list(local.oneDay, ['Rewrite the headline and description', 'Add measurable results from completed work'], 2),
    highImpactFixes: list([local.maximumEffect], ['Connect the service to a concrete client result'], 1),
    improvedHeadline: local.improvements.headline || 'Websites and Telegram bots with a clear result',
    improvedDescription: local.improvements.description || 'Describe the client task, your process, and the result they receive.',
    phrasesToRemove: local.improvements.remove,
    phrasesToAdd: local.improvements.add,
    kworkRecommendations: [local.improvements.structure || 'Show the service structure and result on the first screen.'],
    portfolioRecommendations: [local.improvements.portfolio || 'Add 2–3 cases with the task, solution, and measurable outcome.'],
    pricingRecommendations: [local.improvements.price || 'Tie the price to the scope of work and expected result.'],
    missingDataWarnings: local.missingDataWarnings || [],
  };
};

export async function analyzeWithAi(profile: ProfileInput, options: AnalyzeOptions = {}): Promise<AnalysisResponse> {
  const key = process.env.OPENROUTER_API_KEY;
  const relayUrl = process.env.AI_RELAY_URL?.replace(/\/+$/, '');
  const relaySecret = process.env.AI_RELAY_SECRET;
  const platform = options.platform ?? 'Профиль фрилансера';
  if (!key && !(relayUrl && relaySecret)) return buildFallbackResponse(profile, 'AI-анализ пока недоступен: используется базовый анализ профиля.', platform);

  try {
    const targetUrl = relayUrl ? `${relayUrl}/ai/analyze` : `${process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'}/chat/completions`;
    const requestInit: RequestInit = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${relayUrl ? relaySecret : key}`,
        'Content-Type': 'application/json',
        ...(relayUrl ? {} : process.env.OPENROUTER_SITE_URL ? { 'HTTP-Referer': process.env.OPENROUTER_SITE_URL } : {}),
        ...(relayUrl ? {} : process.env.OPENROUTER_APP_NAME ? { 'X-Title': process.env.OPENROUTER_APP_NAME } : {}),
      },
      body: JSON.stringify({
        model: resolveOpenRouterModel(options.model),
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Профиль фрилансера на ${platform} для анализа:\n${JSON.stringify(profile)}` },
        ],
        response_format: { type: 'json_schema', json_schema: { name: 'freelance_profile_audit', strict: true, schema: AI_JSON_SCHEMA } },
        // The structured report contains five client perspectives plus four
        // recommendation groups. Keep enough room for a complete JSON object;
        // the prompt/schema keep each field compact so paid requests do not
        // silently fall back just because the response was too verbose.
        max_tokens: outputTokenBudget(options.model),
      }),
    };
    let response: Response | undefined;
    // Each retry gets a fresh AbortController. A timed-out first request must
    // not leave the signal for the next request permanently aborted.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const attemptController = new AbortController();
      const attemptTimeout = setTimeout(() => attemptController.abort(), 30_000);
      try {
        response = await fetch(targetUrl, { ...requestInit, signal: attemptController.signal });
        break;
      } catch (error) {
        console.warn('[AI] relay attempt failed', { attempt: attempt + 1, message: error instanceof Error ? error.message : String(error) });
        if (attempt === 2) throw error;
        await new Promise((resolve) => setTimeout(resolve, 1_500));
      } finally {
        clearTimeout(attemptTimeout);
      }
    }
    if (!response) throw new Error('AI request did not return a response');
    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      console.error(`[AI] request failed: ${response.status} ${response.statusText}`, errorBody.slice(0, 500));
      throw new Error(`AI request failed: ${response.status}`);
    }
    const payload = await response.json();
    const content = extractProviderContent(payload);
    if (content === null || content === undefined || (typeof content === 'string' && !content.trim())) throw new Error('AI returned an empty response');
    const parsedContent = typeof content === 'string' ? (() => { try { return JSON.parse(content); } catch { return content; } })() : content;
    const local = createProfileAudit(profile, platform);
    const directReport = parseAiReport(parsedContent);
    const report = directReport ?? parseAiReport(completeAiPayload(parsedContent, local)) ?? guaranteedAiReport(local);
    if (!directReport) console.warn('[AI] provider response was partial; local defaults completed the report');
    const audit: ProfileAudit = { ...local, analysisMode: 'ai', analysisSummary: report.overallSummary, barrier: { title: report.mainBarrier, description: report.overallSummary }, likelihood: report.orderProbability, trustLabel: report.trustLevel, issues: report.topProblems, quickWins: report.quickWins, oneDay: report.oneDayFixes, maximumEffect: report.highImpactFixes[0], clientViews: report.clientPerspectives, missingDataWarnings: report.missingDataWarnings, improvements: { ...local.improvements, headline: report.improvedHeadline, description: report.improvedDescription, remove: report.phrasesToRemove, add: report.phrasesToAdd, portfolio: report.portfolioRecommendations.join(' '), price: report.pricingRecommendations.join(' '), structure: report.kworkRecommendations.join(' ') } };
    return { audit, mode: 'ai', notice: directReport ? undefined : 'AI-отчёт дополнен локальными данными, чтобы сохранить полный формат.' };
  } catch (error) {
    console.error('[AI] analysis unavailable:', error instanceof Error ? error.message : String(error));
    return buildFallbackResponse(profile, 'AI-анализ временно недоступен: используется базовый анализ профиля.', platform);
  }
}
