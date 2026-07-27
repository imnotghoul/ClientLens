import { emptyProfile, type ProfileAudit, type ProfileInput } from '../src/domain/profile';
import { createProfileAudit } from '../src/scoring/profile-scoring';
import { SYSTEM_PROMPT } from './prompt';
import { AI_JSON_SCHEMA, parseAiReport } from './schema';

export type AnalysisResponse = { audit: ProfileAudit; mode: 'ai' | 'basic'; notice?: string };
type AnalyzeOptions = {
  model?: 'gpt-5.6-luna' | 'gpt-5.6-terra' | 'gpt-5.6-sol';
  platform?: string;
};

const resolveOpenRouterModel = (model?: AnalyzeOptions['model']): string => {
  if (model === 'gpt-5.6-terra') return process.env.OPENROUTER_MODEL_TERRA || 'openai/gpt-5.6-terra';
  if (model === 'gpt-5.6-sol') return process.env.OPENROUTER_MODEL_SOL || 'anthropic/claude-opus-5';
  return process.env.OPENROUTER_MODEL_LUNA || 'openai/gpt-5.6-luna';
};

const completeProfile = (partial: Partial<ProfileInput>): ProfileInput => ({ ...emptyProfile, ...partial });
export const buildFallbackResponse = (partial: Partial<ProfileInput>, notice: string, platform = 'Профиль фрилансера'): AnalysisResponse => ({ audit: { ...createProfileAudit(completeProfile(partial), platform), analysisMode: 'basic', analysisSummary: notice }, mode: 'basic', notice });

export async function analyzeWithAi(profile: ProfileInput, options: AnalyzeOptions = {}): Promise<AnalysisResponse> {
  const key = process.env.OPENROUTER_API_KEY;
  const platform = options.platform ?? 'Профиль фрилансера';
  if (!key) return buildFallbackResponse(profile, 'AI-анализ пока недоступен: используется базовый анализ профиля.', platform);
  try {
    const baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        ...(process.env.OPENROUTER_SITE_URL ? { 'HTTP-Referer': process.env.OPENROUTER_SITE_URL } : {}),
        ...(process.env.OPENROUTER_APP_NAME ? { 'X-Title': process.env.OPENROUTER_APP_NAME } : {}),
      },
      body: JSON.stringify({
        model: resolveOpenRouterModel(options.model),
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Профиль фрилансера на ${platform} для анализа:\n${JSON.stringify(profile)}` },
        ],
        response_format: { type: 'json_schema', json_schema: { name: 'freelance_profile_audit', strict: true, schema: AI_JSON_SCHEMA } },
        max_tokens: 2600,
      }),
    });
    if (!response.ok) throw new Error(`OpenRouter request failed: ${response.status}`);
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string | null } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) throw new Error('OpenRouter returned an empty response');
    const report = parseAiReport(JSON.parse(content));
    if (!report) return buildFallbackResponse(profile, 'AI вернул неполный отчёт, поэтому показан базовый анализ.', platform);
    const local = createProfileAudit(profile, platform);
    const audit: ProfileAudit = { ...local, analysisMode: 'ai', analysisSummary: report.overallSummary, barrier: { title: report.mainBarrier, description: report.overallSummary }, likelihood: report.orderProbability, trustLabel: report.trustLevel, issues: report.topProblems, quickWins: report.quickWins, oneDay: report.oneDayFixes, maximumEffect: report.highImpactFixes[0], clientViews: report.clientPerspectives, missingDataWarnings: report.missingDataWarnings, improvements: { ...local.improvements, headline: report.improvedHeadline, description: report.improvedDescription, remove: report.phrasesToRemove, add: report.phrasesToAdd, portfolio: report.portfolioRecommendations.join(' '), price: report.pricingRecommendations.join(' '), structure: report.kworkRecommendations.join(' ') } };
    return { audit, mode: 'ai' };
  } catch { return buildFallbackResponse(profile, 'AI-анализ временно недоступен: используется базовый анализ профиля.', platform); }
}
