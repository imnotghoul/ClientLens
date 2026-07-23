import { supabase } from '../auth/supabase';
import type { SavedReport } from './report-store';

type AuditRow = { id: string; user_id: string; created_at: string; report: SavedReport };

export const toAuditRow = (userId: string, report: SavedReport): AuditRow => ({
  id: report.id,
  user_id: userId,
  created_at: report.createdAt,
  report,
});

export async function listCloudReports(userId: string): Promise<SavedReport[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('audits').select('report').eq('user_id', userId).order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map((row) => row.report as SavedReport);
}

export async function saveCloudReport(userId: string, report: SavedReport): Promise<void> {
  if (!supabase) return;
  await supabase.from('audits').upsert(toAuditRow(userId, report));
}

export async function deleteCloudReport(id: string): Promise<void> {
  if (!supabase) return;
  await supabase.from('audits').delete().eq('id', id);
}
