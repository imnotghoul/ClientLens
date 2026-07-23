import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(url && key);
export const supabase: SupabaseClient | null = isSupabaseConfigured ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }) : null;
export const isNicknameValid = (nickname: string) => /^[a-zA-Z0-9_]{3,24}$/.test(nickname);
export const isAllowedAuthRedirect = (origin: string): boolean => {
  try {
    const url = new URL(origin);
    return url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname));
  } catch {
    return false;
  }
};
export const isPasswordRecoveryEvent = (event: string): boolean => event === 'PASSWORD_RECOVERY';
export const normalizeOtp = (value: string): string => value.replace(/\D/g, '').slice(0, 8);
export const profileAvatarLetter = (nickname: string): string => nickname.trim().charAt(0).toUpperCase() || 'C';
export const nicknameErrorMessage = (message: string) => /duplicate|nickname/i.test(message) ? 'Этот ник уже занят. Выберите другой.' : message;
