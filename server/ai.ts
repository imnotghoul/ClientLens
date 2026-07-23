import OpenAI from 'openai';
import { emptyProfile, type ProfileAudit, type ProfileInput } from '../src/domain/profile';
import { createProfileAudit } from '../src/scoring/profile-scoring';
import { SYSTEM_PROMPT } from './prompt';
import { AI_JSON_SCHEMA, parseAiReport } from './schema';

export type AnalysisResponse = { audit: ProfileAudit; mode: 'ai' | 'basic'; notice?: string };
const completeProfile = (partial: Partial<ProfileInput>): ProfileInput => ({ ...emptyProfile, ...partial });
export const buildFallbackResponse = (partial: Partial<ProfileInput>, notice: string): AnalysisResponse => ({ audit: { ...createProfileAudit(completeProfile(partial), 'Kwork'), analysisMode: 'basic', analysisSummary: notice }, mode: 'basic', notice });

export async function analyzeWithAi(profile: ProfileInput, selectedModel?: 'gpt-5.6-luna' | 'gpt-5.6-terra' | 'gpt-5.6-sol'): Promise<AnalysisResponse> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return buildFallbackResponse(profile, 'AI-анализ пока недоступен: используется базовый анализ профиля.');
  try {
    const client = new OpenAI({ apiKey: key });
    const response = await client.responses.create({ model: selectedModel || process.env.OPENAI_MODEL || 'gpt-5.6-luna', input: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: `Профиль Kwork для анализа:\n${JSON.stringify(profile)}` }], text: { format: { type: 'json_schema', name: 'kwork_profile_audit', strict: true, schema: AI_JSON_SCHEMA } }, max_output_tokens: 2600 });
    const report = parseAiReport(JSON.parse(response.output_text));
    if (!report) return buildFallbackResponse(profile, 'AI вернул неполный отчёт, поэтому показан базовый анализ.');
    const local = createProfileAudit(profile, 'Kwork');
    const audit: ProfileAudit = { ...local, analysisMode: 'ai', analysisSummary: report.overallSummary, barrier: { title: report.mainBarrier, description: report.overallSummary }, likelihood: report.orderProbability, trustLabel: report.trustLevel, issues: report.topProblems, quickWins: report.quickWins, oneDay: report.oneDayFixes, maximumEffect: report.highImpactFixes[0], clientViews: report.clientPerspectives, missingDataWarnings: report.missingDataWarnings, improvements: { ...local.improvements, headline: report.improvedHeadline, description: report.improvedDescription, remove: report.phrasesToRemove, add: report.phrasesToAdd, portfolio: report.portfolioRecommendations.join(' '), price: report.pricingRecommendations.join(' '), structure: report.kworkRecommendations.join(' ') } };
    return { audit, mode: 'ai' };
  } catch { return buildFallbackResponse(profile, 'AI-анализ временно недоступен: используется базовый анализ профиля.'); }
}
