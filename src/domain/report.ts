export type AnalysisMode = 'quick' | 'deep' | 'competitive';
export type AiModel = 'gpt-5.6-luna' | 'gpt-5.6-terra' | 'gpt-5.6-sol';
export type CompetitorInput = { name: string; headline: string; price: string; proof: string; profileUrl?: string };
export const aiModels: Record<AiModel, { name: string; description: string }> = {
  'gpt-5.6-luna': { name: 'Luna', description: 'Быстрый и экономичный режим' },
  'gpt-5.6-terra': { name: 'Terra', description: 'Баланс глубины и скорости' },
  'gpt-5.6-sol': { name: 'Sol', description: 'Максимально глубокий разбор' },
};
export const isAiModel = (value: string): value is AiModel => value in aiModels;
export const modeDefaults: Record<AnalysisMode, { title: string; description: string }> = {
  quick: { title: 'Быстрый анализ', description: 'Первое впечатление, риски и быстрые правки.' },
  deep: { title: 'Глубокий анализ', description: 'Полный разбор доверия, позиции и конверсии профиля.' },
  competitive: { title: 'Конкурентный анализ', description: 'Сравнение с 1–3 профилями конкурентов.' },
};
