import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { WebSocketLikeConstructor } from '@supabase/realtime-js';
import WebSocket from 'ws';

const nodeWebSocket = WebSocket as unknown as WebSocketLikeConstructor;

/** Creates a Supabase client that works on Node 20 as well as Node 22+. */
export function createServerSupabaseClient(url: string, key: string): SupabaseClient {
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: nodeWebSocket },
  });
}
