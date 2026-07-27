import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NewcomersPage } from './NewcomersPage';

afterEach(cleanup);

describe('NewcomersPage', () => {
  it('renders five guide cards and opens a selected guide', () => {
    render(<NewcomersPage onAnalyze={vi.fn()} />);

    const guideButtons = screen.getAllByRole('button', { name: /Открыть материал/i });
    expect(guideButtons).toHaveLength(5);

    fireEvent.click(guideButtons[1]);
    expect(screen.getByRole('heading', { name: /нет отзывов/i })).toBeTruthy();
  });

  it('returns to analysis from the guide CTA', () => {
    const onAnalyze = vi.fn();
    render(<NewcomersPage onAnalyze={onAnalyze} />);

    fireEvent.click(screen.getByRole('button', { name: /перейти к анализу/i }));
    expect(onAnalyze).toHaveBeenCalledOnce();
  });
});
