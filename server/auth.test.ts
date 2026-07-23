import { describe, expect, it } from 'vitest';
import { extractBearerToken, requireAuthenticatedUser } from './auth';

describe('analysis authentication', () => {
  it('accepts only a Bearer access token', () => {
    expect(extractBearerToken(undefined)).toBeNull();
    expect(extractBearerToken('Basic abc')).toBeNull();
    expect(extractBearerToken('Bearer ')).toBeNull();
    expect(extractBearerToken('Bearer access-token')).toBe('access-token');
  });

  it('rejects analysis when token verification does not return a user', async () => {
    await expect(requireAuthenticatedUser('token', async () => null)).resolves.toBeNull();
  });

  it('returns the verified user id', async () => {
    await expect(requireAuthenticatedUser('token', async () => 'user-123')).resolves.toBe('user-123');
  });
});
