import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProfileForm } from './ProfileForm';

describe('ProfileForm', () => {
  it('shows the manual input option', () => {
    render(<ProfileForm onAnalyze={vi.fn()} />);
    expect(screen.getByRole('button', { name: /заполнить вручную/i })).toBeTruthy();
  });
});
