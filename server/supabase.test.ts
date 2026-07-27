import { describe, expect, it } from 'vitest';
import { createServerSupabaseClient } from './supabase';

describe('server Supabase client', () => {
  it('can be created without a native Node WebSocket', () => {
    expect(() => createServerSupabaseClient('https://example.supabase.co', 'test-key')).not.toThrow();
  });
});
