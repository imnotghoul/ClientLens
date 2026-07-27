import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRelayApp } from './server';
import http from 'node:http';

const start = async (fetchImpl = vi.fn()) => {
  const server = http.createServer(createRelayApp({ secret: 'test-secret', fetchImpl }));
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('server did not start');
  return { server, url: `http://127.0.0.1:${address.port}` };
};

afterEach(() => vi.restoreAllMocks());

describe('AI relay', () => {
  it('returns health without exposing secrets', async () => {
    const { server, url } = await start();
    const response = await fetch(`${url}/health`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    server.close();
  });

  it('rejects requests without the relay secret', async () => {
    const { server, url } = await start();
    const response = await fetch(`${url}/ai/analyze`, { method: 'POST', body: '{}' });
    expect(response.status).toBe(401);
    server.close();
  });

  it('forwards a valid OpenRouter request and returns its JSON', async () => {
    const upstream = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: '{"ok":true}' } }] }), { status: 200 }));
    const { server, url } = await start(upstream);
    const response = await fetch(`${url}/ai/analyze`, {
      method: 'POST',
      headers: { Authorization: 'Bearer test-secret', 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'openai/gpt-5.6-luna', messages: [{ role: 'user', content: 'test' }] }),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ choices: [{ message: { content: '{"ok":true}' } }] });
    expect(upstream).toHaveBeenCalledOnce();
    server.close();
  });
});
