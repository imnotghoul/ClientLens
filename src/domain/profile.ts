export type AnalysisGoal = 'orders' | 'trust' | 'price' | 'impression' | 'weaknesses';
export type OrderLikelihood = 'Низкая' | 'Средняя' | 'Высокая';

export interface ProfileInput {
  name: string; specialization: string; title: string; description: string; services: string; price: string;
  reviews: string; completedOrders: number; portfolio: string; profileUrl: string; extra: string; goal: AnalysisGoal;
}
export interface Insight { title: string; description: string; }
export interface CategoryAudit { name: string; score: number; status: 'Хорошо' | 'Средне' | 'Требует внимания'; explanation: string; recommendation: string; example: string; }
export interface ClientView { label: string; likes: string; doubts: string; reason: string; action: string; }
export interface Improvements { headline: string; description: string; remove: string[]; add: string[]; portfolio: string; price: string; structure: string; before: string; after: string; }
export interface CompetitiveComparison { competitors: { name: string; strengths: string[]; userAdvantages: string[] }[]; actions: string[]; }
export interface ProfileAudit {
  platform: string; score: number; trust: number; likelihood: OrderLikelihood; barrier: Insight; issues: Insight[];
  quickWins: string[]; tenMinutes: string[]; oneDay: string[]; maximumEffect: string; clientViews: ClientView[]; improvements: Improvements;
  analysisMode?: 'ai' | 'basic'; analysisSummary?: string; trustLabel?: string; missingDataWarnings?: string[];
  categories?: CategoryAudit[];
  competitive?: CompetitiveComparison;
}
export const emptyProfile: ProfileInput = { name: '', specialization: '', title: '', description: '', services: '', price: '', reviews: '', completedOrders: 0, portfolio: '', profileUrl: '', extra: '', goal: 'orders' };
