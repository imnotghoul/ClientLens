import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LegalPage } from './LegalPage';

afterEach(cleanup);

describe('LegalPage', () => {
  it('keeps legal identity details off the public contact page', () => {
    render(<LegalPage kind="contacts" onBack={vi.fn()} />);

    expect(screen.queryByText(/Хадизов Халид Юнусович/i)).toBeNull();
    expect(screen.queryByText(/201405007682/)).toBeNull();
    expect(screen.getByRole('link', { name: /Telegram/i }).getAttribute('href')).toBe('https://t.me/zxcis');
  });

  it('shows legal identity details on the public offer page', () => {
    render(<LegalPage kind="offer" onBack={vi.fn()} />);

    expect(screen.getByText(/Хадизов Халид Юнусович/i)).toBeTruthy();
    expect(screen.getByText(/201405007682/)).toBeTruthy();
  });
});
