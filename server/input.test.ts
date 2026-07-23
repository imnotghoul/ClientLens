import { describe, expect, it } from 'vitest';
import { sanitizeProfile } from './input';

describe('sanitizeProfile', () => {
  it('truncates long text before it reaches the AI request', () => {
    const profile = sanitizeProfile({ title: 'Дизайнер', description: 'а'.repeat(2000), completedOrders: 3, goal: 'orders' });
    expect(profile?.description).toHaveLength(1500);
  });

  it('does not allow an entirely empty profile to reach the AI request', () => {
    expect(sanitizeProfile({})).toBeNull();
  });
});
