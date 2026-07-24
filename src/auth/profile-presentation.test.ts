import { describe, expect, it } from 'vitest';
import { toProfilePresentation } from './profile-presentation';

describe('toProfilePresentation', () => {
  it('maps a stored nickname and public avatar URL for shared profile UI', () => {
    expect(toProfilePresentation({ nickname: 'aegis', avatar_path: 'user/avatar.png' }, 'https://cdn.example/avatar.png'))
      .toEqual({ nickname: 'aegis', avatarUrl: 'https://cdn.example/avatar.png' });
  });

  it('does not invent profile data when a profile row is unavailable', () => {
    expect(toProfilePresentation(null, '')).toBeNull();
  });
});
