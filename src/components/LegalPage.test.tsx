import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LegalPage } from './LegalPage';

afterEach(cleanup);

describe('LegalPage', () => {
  it('publishes the self-employed business details and Telegram support contact', () => {
    render(<LegalPage kind="contacts" onBack={vi.fn()} />);

    expect(screen.getByText(/Хадизов Халид Юнусович/i)).toBeTruthy();
    expect(screen.getByText(/201405007682/)).toBeTruthy();
    expect(screen.getByRole('link', { name: /Telegram/i }).getAttribute('href')).toBe('https://t.me/zxcis');
  });
});
