import { createClient } from '@supabase/supabase-js';

type VerifyToken = (token: string) => Promise<string | null>;

export const extractBearerToken = (authorization: string | undefined): string | null => {
  const match = /^Bearer\s+(.+)$/i.exec(authorization ?? '');
  return match?.[1]?.trim() || null;
};

export const requireAuthenticatedUser = async (token: string, verify: VerifyToken): Promise<string | null> => verify(token);

export const verifySupabaseAccessToken: VerifyToken = async (token) => {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  const client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await client.auth.getUser(token);
  return error || !data.user ? null : data.user.id;
};
