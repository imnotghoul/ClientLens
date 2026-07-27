import { z } from 'zod';

const perspective = z.object({ label: z.string().min(1).max(80), likes: z.string().min(1).max(500), doubts: z.string().min(1).max(500), reason: z.string().min(1).max(500), action: z.string().min(1).max(500) });
export const aiReportSchema = z.object({
  overallSummary: z.string().min(1).max(900), mainBarrier: z.string().min(1).max(300), orderProbability: z.enum(['Низкая', 'Средняя', 'Высокая']), trustLevel: z.string().min(1).max(120), clientPerspectives: z.array(perspective).length(5), topProblems: z.array(z.object({ title: z.string().min(1).max(120), description: z.string().min(1).max(500) })).min(3).max(5), quickWins: z.array(z.string().min(1).max(300)).min(3).max(5), oneDayFixes: z.array(z.string().min(1).max(300)).min(2).max(5), highImpactFixes: z.array(z.string().min(1).max(300)).min(1).max(3), improvedHeadline: z.string().min(1).max(300), improvedDescription: z.string().min(1).max(1500), phrasesToRemove: z.array(z.string().min(1).max(200)).max(5), phrasesToAdd: z.array(z.string().min(1).max(200)).max(5), kworkRecommendations: z.array(z.string().min(1).max(300)).min(1).max(4), portfolioRecommendations: z.array(z.string().min(1).max(300)).min(1).max(4), pricingRecommendations: z.array(z.string().min(1).max(300)).min(1).max(4), missingDataWarnings: z.array(z.string().min(1).max(300)).max(5),
});
export type AiReport = z.infer<typeof aiReportSchema>;
const probabilityMap: Record<string, AiReport['orderProbability']> = {
  low: 'Низкая',
  medium: 'Средняя',
  average: 'Средняя',
  high: 'Высокая',
  низкая: 'Низкая',
  средняя: 'Средняя',
  высокая: 'Высокая',
};

const unwrapJson = (value: string): unknown => {
  const trimmed = value.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try { return JSON.parse(trimmed); } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try { return JSON.parse(trimmed.slice(start, end + 1)); } catch { return null; }
    }
    return null;
  }
};

export const parseAiReport = (value: unknown): AiReport | null => {
  const unwrapped = typeof value === 'string' ? unwrapJson(value) : value;
  if (!unwrapped || typeof unwrapped !== 'object' || Array.isArray(unwrapped)) return null;
  const candidate = { ...(unwrapped as Record<string, unknown>) };
  if (typeof candidate.orderProbability === 'string') {
    candidate.orderProbability = probabilityMap[candidate.orderProbability.trim().toLowerCase()] ?? candidate.orderProbability;
  }
  const parsed = aiReportSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
};
export const AI_JSON_SCHEMA = { type: 'object', additionalProperties: false, required: Object.keys(aiReportSchema.shape), properties: { overallSummary: { type: 'string' }, mainBarrier: { type: 'string' }, orderProbability: { type: 'string', enum: ['Низкая', 'Средняя', 'Высокая'] }, trustLevel: { type: 'string' }, clientPerspectives: { type: 'array', minItems: 5, maxItems: 5, items: { type: 'object', additionalProperties: false, required: ['label', 'likes', 'doubts', 'reason', 'action'], properties: { label: { type: 'string' }, likes: { type: 'string' }, doubts: { type: 'string' }, reason: { type: 'string' }, action: { type: 'string' } } } }, topProblems: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['title', 'description'], properties: { title: { type: 'string' }, description: { type: 'string' } } } }, quickWins: { type: 'array', items: { type: 'string' } }, oneDayFixes: { type: 'array', items: { type: 'string' } }, highImpactFixes: { type: 'array', items: { type: 'string' } }, improvedHeadline: { type: 'string' }, improvedDescription: { type: 'string' }, phrasesToRemove: { type: 'array', items: { type: 'string' } }, phrasesToAdd: { type: 'array', items: { type: 'string' } }, kworkRecommendations: { type: 'array', items: { type: 'string' } }, portfolioRecommendations: { type: 'array', items: { type: 'string' } }, pricingRecommendations: { type: 'array', items: { type: 'string' } }, missingDataWarnings: { type: 'array', items: { type: 'string' } } } } as const;
