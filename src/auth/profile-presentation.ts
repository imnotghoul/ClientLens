export type ProfileRow = { nickname: string | null; avatar_path: string | null };
export type ProfilePresentation = { nickname: string; avatarUrl: string };

export function toProfilePresentation(row: ProfileRow | null, publicUrl: string): ProfilePresentation | null {
  if (!row) return null;
  return { nickname: row.nickname ?? '', avatarUrl: row.avatar_path ? publicUrl : '' };
}
