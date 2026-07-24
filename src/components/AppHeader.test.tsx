import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppHeader } from './AppHeader';

afterEach(cleanup);

describe('AppHeader', () => {
  it('uses the ClientLens brand mark in the global header', () => {
    render(<AppHeader activeView="new" reportCount={0} isAuthenticated={false} accountLabel="" onNavigate={vi.fn()} onAuth={vi.fn()} />);
    expect(screen.getByRole('img', { name: 'ClientLens' }).getAttribute('src')).toBe('/brand/clientlens-mark.png');
  });

  it('shows guest auth actions and navigates to reports', () => {
    const onNavigate = vi.fn();
    const onAuth = vi.fn();

    render(<AppHeader activeView="new" reportCount={2} isAuthenticated={false} accountLabel="" onNavigate={onNavigate} onAuth={onAuth} />);

    expect(screen.getByRole('button', { name: 'Регистрация' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Вход' })).toBeTruthy();
    expect(screen.getByRole('banner').className).toContain('app-header');
    expect(screen.getByRole('navigation', { name: 'Основная навигация' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Мои отчёты/i }));
    expect(onNavigate).toHaveBeenCalledWith('reports');
  });

  it('shows an account trigger with the user initial for signed-in users', () => {
    render(<AppHeader activeView="reports" reportCount={0} isAuthenticated identityReady accountLabel="aegis" avatarUrl="" onNavigate={vi.fn()} onAuth={vi.fn()} />);

    expect(screen.getByRole('button', { name: /Аккаунт/i })).toBeTruthy();
    expect(screen.getByText('A')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Вход' })).toBeNull();
  });

  it('uses the uploaded profile avatar instead of an email-derived initial', () => {
    render(<AppHeader activeView="new" reportCount={0} isAuthenticated identityReady accountLabel="aegis" avatarUrl="https://cdn.example/avatar.png" onNavigate={vi.fn()} onAuth={vi.fn()} />);
    expect(screen.getByRole('img', { name: 'Аватар аккаунта' }).getAttribute('src')).toBe('https://cdn.example/avatar.png');
  });
});
