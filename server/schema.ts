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

const clip = (value: unknown, max: number): unknown => typeof value === 'string' ? value.trim().slice(0, max) : value;

const normalizeCandidate = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = { ...(value as Record<string, unknown>) };
  const limits: Record<string, number> = {
    clientPerspectives: 5, topProblems: 5, quickWins: 5, oneDayFixes: 5,
    highImpactFixes: 3, phrasesToRemove: 5, phrasesToAdd: 5,
    kworkRecommendations: 4, portfolioRecommendations: 4,
    pricingRecommendations: 4, missingDataWarnings: 5,
  };
  for (const [key, limit] of Object.entries(limits)) {
    if (Array.isArray(candidate[key])) candidate[key] = candidate[key].slice(0, limit);
  }
  if (typeof candidate.orderProbability === 'string') {
    candidate.orderProbability = probabilityMap[candidate.orderProbability.trim().toLowerCase()] ?? candidate.orderProbability;
  }
  candidate.overallSummary = clip(candidate.overallSummary, 900);
  candidate.mainBarrier = clip(candidate.mainBarrier, 300);
  candidate.trustLevel = clip(candidate.trustLevel, 120);
  candidate.improvedHeadline = clip(candidate.improvedHeadline, 300);
  candidate.improvedDescription = clip(candidate.improvedDescription, 1500);
  const stringArrayLimits: Record<string, number> = {
    quickWins: 300, oneDayFixes: 300, highImpactFixes: 300, phrasesToRemove: 200,
    phrasesToAdd: 200, kworkRecommendations: 300, portfolioRecommendations: 300,
    pricingRecommendations: 300, missingDataWarnings: 300,
  };
  for (const [key, max] of Object.entries(stringArrayLimits)) {
    if (Array.isArray(candidate[key])) candidate[key] = candidate[key].map((item) => clip(item, max));
  }
  if (Array.isArray(candidate.clientPerspectives)) {
    candidate.clientPerspectives = candidate.clientPerspectives.map((item) => {
      if (!item || typeof item !== 'object') return item;
      const perspectiveValue = { ...(item as Record<string, unknown>) };
      perspectiveValue.label = clip(perspectiveValue.label, 80);
      perspectiveValue.likes = clip(perspectiveValue.likes, 500);
      perspectiveValue.doubts = clip(perspectiveValue.doubts, 500);
      perspectiveValue.reason = clip(perspectiveValue.reason, 500);
      perspectiveValue.action = clip(perspectiveValue.action, 500);
      return perspectiveValue;
    });
  }
  if (Array.isArray(candidate.topProblems)) {
    candidate.topProblems = candidate.topProblems.map((item) => {
      if (!item || typeof item !== 'object') return item;
      const problem = { ...(item as Record<string, unknown>) };
      problem.title = clip(problem.title, 120);
      problem.description = clip(problem.description, 500);
      return problem;
    });
  }
  return candidate;
};

export const parseAiReport = (value: unknown): AiReport | null => {
  const unwrapped = typeof value === 'string' ? unwrapJson(value) : value;
  const candidate = normalizeCandidate(unwrapped);
  if (!candidate) return null;
  const parsed = aiReportSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
};

export const explainAiReportFailure = (value: unknown): Array<{ path: string; code: string; message: string }> => {
  const unwrapped = typeof value === 'string' ? unwrapJson(value) : value;
  const candidate = normalizeCandidate(unwrapped);
  if (!candidate) {
    return [{ path: '', code: 'invalid_type', message: 'Response is not a JSON object' }];
  }
  const parsed = aiReportSchema.safeParse(candidate);
  return parsed.success ? [] : parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), code: issue.code, message: issue.message }));
};
export const AI_JSON_SCHEMA = { type: 'object', additionalProperties: false, required: Object.keys(aiReportSchema.shape), properties: { overallSummary: { type: 'string' }, mainBarrier: { type: 'string' }, orderProbability: { type: 'string', enum: ['Низкая', 'Средняя', 'Высокая'] }, trustLevel: { type: 'string' }, clientPerspectives: { type: 'array', minItems: 5, maxItems: 5, items: { type: 'object', additionalProperties: false, required: ['label', 'likes', 'doubts', 'reason', 'action'], properties: { label: { type: 'string' }, likes: { type: 'string' }, doubts: { type: 'string' }, reason: { type: 'string' }, action: { type: 'string' } } } }, topProblems: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['title', 'description'], properties: { title: { type: 'string' }, description: { type: 'string' } } } }, quickWins: { type: 'array', items: { type: 'string' } }, oneDayFixes: { type: 'array', items: { type: 'string' } }, highImpactFixes: { type: 'array', items: { type: 'string' } }, improvedHeadline: { type: 'string' }, improvedDescription: { type: 'string' }, phrasesToRemove: { type: 'array', items: { type: 'string' } }, phrasesToAdd: { type: 'array', items: { type: 'string' } }, kworkRecommendations: { type: 'array', items: { type: 'string' } }, portfolioRecommendations: { type: 'array', items: { type: 'string' } }, pricingRecommendations: { type: 'array', items: { type: 'string' } }, missingDataWarnings: { type: 'array', items: { type: 'string' } } } } as const;
