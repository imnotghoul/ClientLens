import { describe, expect, it } from 'vitest';
import { newcomerGuides } from './newcomer-guides';

describe('newcomer guides', () => {
  it('provides five complete practical guides for Kwork newcomers', () => {
    expect(newcomerGuides).toHaveLength(5);

    newcomerGuides.forEach((guide) => {
      expect(guide.id).toEqual(expect.any(String));
      expect(guide.title).toEqual(expect.any(String));
      expect(guide.summary).toEqual(expect.any(String));
      expect(guide.problem).toEqual(expect.any(String));
      expect(guide.fixes.length).toBeGreaterThanOrEqual(3);
      expect(guide.checklist.length).toBeGreaterThanOrEqual(3);
      if (guide.example) {
        expect(guide.example.before).toEqual(expect.any(String));
        expect(guide.example.after).toEqual(expect.any(String));
      }
    });
  });
});
