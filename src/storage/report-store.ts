import type { ProfileAudit, ProfileInput } from '../domain/profile';
import type { AnalysisMode, AiModel } from '../domain/report';
export type SavedReport = { id: string; createdAt: string; title: string; mode: AnalysisMode; model: AiModel; input: ProfileInput; audit: ProfileAudit };
const key = 'freelance-trust-reports-v1';
const read = (): SavedReport[] => { try { return JSON.parse(localStorage.getItem(key) || '[]') as SavedReport[]; } catch { return []; } };
export const listReports = () => read();
export const saveReport = (report: Omit<SavedReport, 'id' | 'createdAt'>) => { const item = { ...report, id: crypto.randomUUID(), createdAt: new Date().toISOString() }; localStorage.setItem(key, JSON.stringify([item, ...read()].slice(0, 30))); return item; };
export const deleteReport = (id: string) => localStorage.setItem(key, JSON.stringify(read().filter((item) => item.id !== id)));
