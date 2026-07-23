import { describe, expect, it } from 'vitest';
import { getAnalysisPrice } from './pricing';

describe('launch pricing', () => {
  it('keeps the maximum Sol analysis below 400 rubles', () => {
    expect(getAnalysisPrice('competitive', 'gpt-5.6-sol')).toBe(349);
  });

  it('keeps Luna deep analysis accessible for a first purchase', () => {
    expect(getAnalysisPrice('deep', 'gpt-5.6-luna')).toBe(79);
  });
});
