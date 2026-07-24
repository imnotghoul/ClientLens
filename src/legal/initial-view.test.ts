import { describe, expect, it } from 'vitest';
import { initialViewFromPath } from './initial-view';

describe('initialViewFromPath', () => {
  it('opens the new analysis at the root URL regardless of the last saved page', () => {
    expect(initialViewFromPath('/')).toBe('new');
  });

  it('preserves a public page only when its direct URL was opened', () => {
    expect(initialViewFromPath('/offer')).toBe('offer');
  });
});
