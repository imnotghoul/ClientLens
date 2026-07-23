import { describe, expect, it } from 'vitest';
import { isProduction } from './production';

describe('production server configuration', () => {
  it('enables production mode only for NODE_ENV=production', () => {
    expect(isProduction('production')).toBe(true);
    expect(isProduction('development')).toBe(false);
    expect(isProduction(undefined)).toBe(false);
  });
});
