import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProfileForm } from './ProfileForm';

afterEach(cleanup);

describe('ProfileForm', () => {
  it('shows the manual input option', () => {
    render(<ProfileForm onAnalyze={vi.fn()} />);
    expect(screen.getByRole('button', { name: /дополнить данные вручную/i })).toBeTruthy();
  });

  it('uses a marketplace-neutral profile link label', () => {
    render(<ProfileForm onAnalyze={vi.fn()} />);
    expect(screen.getByText('Ссылка на профиль фрилансера')).toBeTruthy();
    expect(screen.getByText(/Kwork, FL.ru и Freelance.ru/i)).toBeTruthy();
  });

  it('offers a separate profile URL field for a competitor', () => {
    render(<ProfileForm onAnalyze={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /конкурентный анализ/i }));
    expect(screen.getByPlaceholderText('https://…')).toBeTruthy();
  });

  it('does not advertise a free Luna request', () => {
    render(<ProfileForm onAnalyze={vi.fn()} />);
    expect(screen.queryByText(/Первый AI-анализ Luna.*бесплатно/i)).toBeNull();
    expect(screen.getByText('AI-анализ через OpenRouter')).toBeTruthy();
  });
});
