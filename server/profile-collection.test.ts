import { describe, expect, it } from 'vitest';
import { detectPlatform, validatePublicProfileUrl } from './profile-collection';

describe('public profile collection', () => {
  it('detects each supported marketplace', () => {
    expect(detectPlatform('https://kwork.ru/user/example')).toBe('kwork');
    expect(detectPlatform('https://www.fl.ru/users/example/')).toBe('flru');
    expect(detectPlatform('https://freelance.ru/example')).toBe('freelanceRu');
  });

  it('rejects private addresses and unsupported domains', () => {
    expect(validatePublicProfileUrl('http://127.0.0.1/admin')).toBeNull();
    expect(validatePublicProfileUrl('https://evil.example/kwork.ru/user/a')).toBeNull();
  });
});
