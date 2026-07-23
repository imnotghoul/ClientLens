import { beforeEach, describe, expect, it } from 'vitest';
import { canUseFreeLuna, consumeFreeLuna } from './usage';

describe('free Luna usage', () => {
  beforeEach(() => localStorage.clear());
  it('allows one free Luna AI request per browser', () => {
    expect(canUseFreeLuna()).toBe(true);
    consumeFreeLuna();
    expect(canUseFreeLuna()).toBe(false);
  });
});
