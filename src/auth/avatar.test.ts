import { describe, expect, it } from 'vitest';
import { avatarFileExtension, isAvatarMimeType } from './avatar';

describe('avatar upload helpers', () => {
  it('accepts common browser image formats', () => {
    expect(isAvatarMimeType('image/jpeg')).toBe(true);
    expect(isAvatarMimeType('image/png')).toBe(true);
    expect(isAvatarMimeType('image/webp')).toBe(true);
  });

  it('rejects non-image files and maps uploaded images to safe extensions', () => {
    expect(isAvatarMimeType('application/pdf')).toBe(false);
    expect(avatarFileExtension('image/jpeg')).toBe('jpg');
    expect(avatarFileExtension('image/png')).toBe('png');
    expect(avatarFileExtension('image/webp')).toBe('webp');
  });
});
