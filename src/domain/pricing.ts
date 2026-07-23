import type { AiModel, AnalysisMode } from './report';

export const analysisPrices: Record<AnalysisMode, Record<AiModel, number>> = {
  quick: { 'gpt-5.6-luna': 29, 'gpt-5.6-terra': 69, 'gpt-5.6-sol': 149 },
  deep: { 'gpt-5.6-luna': 79, 'gpt-5.6-terra': 149, 'gpt-5.6-sol': 249 },
  competitive: { 'gpt-5.6-luna': 119, 'gpt-5.6-terra': 229, 'gpt-5.6-sol': 349 },
};

export function getAnalysisPrice(mode: AnalysisMode, model: AiModel): number {
  return analysisPrices[mode][model];
}
