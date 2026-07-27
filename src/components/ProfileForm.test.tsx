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

  it('advertises the free Luna price only for a first quick Luna analysis', () => {
    render(<ProfileForm onAnalyze={vi.fn()} freeQuickLunaAvailable />);
    const price = () => document.querySelector('.price-panel strong')?.textContent;
    const freeCopy = 'Первый быстрый анализ Luna — бесплатно';

    expect(price()).not.toMatch(/^0/);
    expect(screen.queryByText(freeCopy)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /быстрый анализ/i }));
    expect(price()).toMatch(/^0/);
    expect(screen.getByText(freeCopy)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Terra' }));
    expect(price()).toMatch(/^69/);
    expect(screen.queryByText(freeCopy)).toBeNull();
  });
});
