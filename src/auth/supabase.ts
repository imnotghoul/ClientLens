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
export const authErrorMessage = (message: string, context: 'login' | 'register' | 'reset' = 'login'): string => {
  if (/nickname|profiles_nickname/i.test(message)) return 'Этот ник уже занят. Выберите другой.';
  if (/already registered|already exists|duplicate/i.test(message)) return 'Эта почта уже зарегистрирована.';
  if (/invalid login credentials|invalid email or password/i.test(message)) return 'Проверьте почту и пароль.';
  if (/email not confirmed/i.test(message)) return 'Сначала подтвердите почту.';
  if (context === 'reset') return 'Не удалось отправить код. Проверьте почту и попробуйте ещё раз.';
  return 'Не удалось выполнить действие. Попробуйте ещё раз.';
};
export const isAlreadyRegisteredSignUp = (result: { user?: { identities?: unknown[] } | null } | null | undefined): boolean => Boolean(result?.user && Array.isArray(result.user.identities) && result.user.identities.length === 0);
export const isEmailTaken = (result: { available: boolean | null; error: unknown } | null | undefined): boolean => Boolean(result && result.error == null && result.available === false);
