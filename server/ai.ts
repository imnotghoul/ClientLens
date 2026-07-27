import { emptyProfile, type ProfileAudit, type ProfileInput } from '../src/domain/profile';
import { createProfileAudit } from '../src/scoring/profile-scoring';
import { SYSTEM_PROMPT } from './prompt';
import { AI_JSON_SCHEMA, explainAiReportFailure, parseAiReport } from './schema';

export type AnalysisResponse = { audit: ProfileAudit; mode: 'ai' | 'basic'; notice?: string };
type AnalyzeOptions = { model?: 'gpt-5.6-luna' | 'gpt-5.6-terra' | 'gpt-5.6-sol'; platform?: string };

const resolveOpenRouterModel = (model?: AnalyzeOptions['model']): string => {
  if (model === 'gpt-5.6-terra') return process.env.OPENROUTER_MODEL_TERRA || 'openai/gpt-5.6-terra';
  if (model === 'gpt-5.6-sol') return process.env.OPENROUTER_MODEL_SOL || 'openai/gpt-5.6-sol';
  return process.env.OPENROUTER_MODEL_LUNA || 'openai/gpt-5.6-luna';
};

const completeProfile = (partial: Partial<ProfileInput>): ProfileInput => ({ ...emptyProfile, ...partial });
export const buildFallbackResponse = (partial: Partial<ProfileInput>, notice: string, platform = 'Профиль фрилансера'): AnalysisResponse => ({ audit: { ...createProfileAudit(completeProfile(partial), platform), analysisMode: 'basic', analysisSummary: notice }, mode: 'basic', notice });

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
        // recommendation groups. 2600 tokens can truncate the JSON before
        // the closing brace, which then forces a paid request into fallback.
        max_tokens: 5000,
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
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string | null } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) throw new Error('AI returned an empty response');
    const parsedContent = (() => { try { return JSON.parse(content); } catch { return content; } })();
    const report = parseAiReport(parsedContent);
    if (!report) {
      const shape = parsedContent && typeof parsedContent === 'object' && !Array.isArray(parsedContent)
        ? Object.fromEntries(Object.entries(parsedContent as Record<string, unknown>).map(([key, value]) => [key, Array.isArray(value) ? `array:${value.length}` : typeof value]))
        : { type: typeof parsedContent };
      console.error('[AI] report validation failed', { keys: Object.keys(shape), shape });
      console.error('[AI] validation issues', explainAiReportFailure(parsedContent));
    }
    if (!report) return buildFallbackResponse(profile, 'AI вернул неполный отчёт, поэтому показан базовый анализ.', platform);
    const local = createProfileAudit(profile, platform);
    const audit: ProfileAudit = { ...local, analysisMode: 'ai', analysisSummary: report.overallSummary, barrier: { title: report.mainBarrier, description: report.overallSummary }, likelihood: report.orderProbability, trustLabel: report.trustLevel, issues: report.topProblems, quickWins: report.quickWins, oneDay: report.oneDayFixes, maximumEffect: report.highImpactFixes[0], clientViews: report.clientPerspectives, missingDataWarnings: report.missingDataWarnings, improvements: { ...local.improvements, headline: report.improvedHeadline, description: report.improvedDescription, remove: report.phrasesToRemove, add: report.phrasesToAdd, portfolio: report.portfolioRecommendations.join(' '), price: report.pricingRecommendations.join(' '), structure: report.kworkRecommendations.join(' ') } };
    return { audit, mode: 'ai' };
  } catch (error) {
    console.error('[AI] analysis unavailable:', error instanceof Error ? error.message : String(error));
    return buildFallbackResponse(profile, 'AI-анализ временно недоступен: используется базовый анализ профиля.', platform);
  }
}
