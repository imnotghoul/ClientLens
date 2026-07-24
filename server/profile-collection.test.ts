import { describe, expect, it } from 'vitest';
import { detectPlatform, platformLabel, validatePublicProfileUrl } from './profile-collection';

describe('public profile collection', () => {
  it('detects each supported marketplace', () => {
    expect(detectPlatform('https://kwork.ru/user/example')).toBe('kwork');
    expect(detectPlatform('https://www.fl.ru/users/example/')).toBe('flru');
    expect(detectPlatform('https://freelance.ru/example')).toBe('freelanceRu');
  });

  it('uses human-readable names for every supported marketplace', () => {
    expect(platformLabel('kwork')).toBe('Kwork');
    expect(platformLabel('flru')).toBe('FL.ru');
    expect(platformLabel('freelanceRu')).toBe('Freelance.ru');
    expect(platformLabel()).toBe('Профиль фрилансера');
  });

  it('rejects private addresses and unsupported domains', () => {
    expect(validatePublicProfileUrl('http://127.0.0.1/admin')).toBeNull();
    expect(validatePublicProfileUrl('https://evil.example/kwork.ru/user/a')).toBeNull();
  });
});
