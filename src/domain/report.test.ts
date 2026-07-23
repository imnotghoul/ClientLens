import { describe, expect, it } from 'vitest';
import { isAiModel, modeDefaults } from './report';

describe('analysis mode configuration', () => {
  it('keeps only supported GPT-5.6 models', () => {
    expect(isAiModel('gpt-5.6-luna')).toBe(true);
    expect(isAiModel('gpt-4o')).toBe(false);
  });

  it('uses deep mode as the full report', () => {
    expect(modeDefaults.deep.title).toMatch(/глубок/i);
  });
});
