import type { ProfileInput } from '../domain/profile';
import type { ProfileAudit } from '../domain/profile';
import type { AiModel, AnalysisMode, CompetitorInput } from '../domain/report';

export type AnalysisResponse = { audit: ProfileAudit; mode: 'ai' | 'basic'; notice?: string };

export type AnalysisRequest = { profile: ProfileInput; mode: AnalysisMode; model: AiModel; competitors: CompetitorInput[] };
export async function requestAnalysis(request: AnalysisRequest, accessToken: string): Promise<AnalysisResponse> {
  const response = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify(request) });
  if (!response.ok) throw new Error('Не удалось запустить анализ.');
  return response.json() as Promise<AnalysisResponse>;
}
