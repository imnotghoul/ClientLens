import { describe, expect, it } from 'vitest';
import { withAvatarCacheBust } from './avatar-url';

describe('avatar cache busting', () => {
  it('adds a stable version query to a public avatar URL', () => {
    expect(withAvatarCacheBust('https://cdn.example/avatar.jpg', 42)).toBe('https://cdn.example/avatar.jpg?v=42');
    expect(withAvatarCacheBust('https://cdn.example/avatar.jpg?token=x', 42)).toBe('https://cdn.example/avatar.jpg?token=x&v=42');
  });
});
