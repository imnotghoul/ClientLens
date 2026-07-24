import { describe, expect, it } from 'vitest';
import { pathForPublicPage, publicPageFromPath } from './public-pages';

describe('public payment pages', () => {
  it('maps public payment URLs to their pages', () => {
    expect(publicPageFromPath('/contacts')).toBe('contacts');
    expect(publicPageFromPath('/offer')).toBe('offer');
    expect(publicPageFromPath('/pricing')).toBe('pricing');
    expect(pathForPublicPage('contacts')).toBe('/contacts');
  });
});
