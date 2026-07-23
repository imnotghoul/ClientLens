import { describe, expect, it } from 'vitest';
import { isAllowedAuthRedirect, isNicknameValid, isPasswordRecoveryEvent, nicknameErrorMessage, normalizeOtp, profileAvatarLetter } from './supabase';

describe('profile validation', () => {
  it('accepts a safe nickname and rejects spaces or short values', () => {
    expect(isNicknameValid('halid_dev')).toBe(true);
    expect(isNicknameValid('ab')).toBe(false);
    expect(isNicknameValid('halid dev')).toBe(false);
  });

  it('turns a duplicate nickname database error into a clear message', () => {
    expect(nicknameErrorMessage('duplicate key value violates unique constraint "profiles_nickname_key"')).toMatch(/занят/i);
  });

  it('allows only HTTPS or local development authentication redirects', () => {
    expect(isAllowedAuthRedirect('https://clientlens.ru')).toBe(true);
    expect(isAllowedAuthRedirect('http://127.0.0.1:5173')).toBe(true);
    expect(isAllowedAuthRedirect('http://evil.example')).toBe(false);
  });

  it('recognizes the Supabase password recovery event', () => {
    expect(isPasswordRecoveryEvent('PASSWORD_RECOVERY')).toBe(true);
    expect(isPasswordRecoveryEvent('SIGNED_IN')).toBe(false);
  });

  it('accepts the eight-digit OTP sent by the email template', () => {
    expect(normalizeOtp('24523154')).toBe('24523154');
    expect(normalizeOtp('245231541')).toBe('24523154');
  });

  it('uses the nickname initial for an avatar fallback', () => {
    expect(profileAvatarLetter('aegis')).toBe('A');
    expect(profileAvatarLetter('')).toBe('C');
  });
});
