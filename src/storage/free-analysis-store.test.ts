import { afterEach, describe, expect, it } from 'vitest';
import { hasUsedFreeQuickLuna, markFreeQuickLunaUsed, shouldConsumeFreeQuickLuna } from './free-analysis-store';

const storageKey = (userId: string) => `clientlens-free-quick-luna-v1:${userId}`;

afterEach(() => localStorage.clear());

describe('free quick Luna storage', () => {
  it('does not consume the free attempt when the server returns a basic fallback', () => {
    const request = { mode: 'quick', model: 'gpt-5.6-luna' };

    expect(shouldConsumeFreeQuickLuna(request, 'basic')).toBe(false);
    expect(shouldConsumeFreeQuickLuna(request, 'ai')).toBe(true);
  });

  it('makes the first quick Luna analysis available', () => {
    expect(hasUsedFreeQuickLuna('user-1')).toBe(false);
  });

  it('marks a used free quick Luna analysis', () => {
    markFreeQuickLunaUsed('user-1');

    expect(hasUsedFreeQuickLuna('user-1')).toBe(true);
    expect(localStorage.getItem(storageKey('user-1'))).toBe('used');
  });

  it('keeps the entitlement available for another account', () => {
    markFreeQuickLunaUsed('user-1');

    expect(hasUsedFreeQuickLuna('user-2')).toBe(false);
  });
});
