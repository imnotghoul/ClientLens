import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./supabase', () => ({
  isAllowedAuthRedirect: () => true,
  isNicknameValid: () => true,
  isPasswordRecoveryEvent: () => false,
  isSupabaseConfigured: true,
  nicknameErrorMessage: (message: string) => message,
  normalizeOtp: (value: string) => value,
  profileAvatarLetter: () => 'C',
  supabase: null,
}));

import { AccountPanel } from './AccountPanel';

afterEach(cleanup);

describe('AccountPanel', () => {
  it('opens the registration form when requested by header navigation', () => {
    render(<AccountPanel initialScreen="register" />);
    expect(screen.getByRole('heading', { name: 'Создать аккаунт' })).toBeTruthy();
  });

  it('switches between login and registration when the header intent changes', () => {
    const { rerender } = render(<AccountPanel initialScreen="register" />);
    expect(screen.getByRole('heading', { name: /Создать аккаунт/i })).toBeTruthy();

    rerender(<AccountPanel initialScreen="login" />);

    expect(screen.getByRole('heading', { name: /Войти/i })).toBeTruthy();
  });
});
