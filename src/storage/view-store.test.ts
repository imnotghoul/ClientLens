import { describe, expect, it } from 'vitest';
import { isSavedView } from './view-store';

describe('view storage', () => {
  it('accepts only known application views', () => {
    expect(isSavedView('profile')).toBe(true);
    expect(isSavedView('settings')).toBe(false);
    expect(isSavedView('anything-else')).toBe(false);
  });
});
