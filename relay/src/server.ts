import 'dotenv/config';
import express, { type Express } from 'express';
import { rateLimit } from 'express-rate-limit';

type RelayOptions = {
  secret?: string;
  fetchImpl?: typeof fetch;
};

export function createRelayApp(options: RelayOptions = {}): Express {
  const app = express();
  const secret = options.secret ?? process.env.RELAY_SECRET ?? process.env.AI_RELAY_SECRET ?? '';
  const fetchImpl = options.fetchImpl ?? fetch;

  app.disable('x-powered-by');
  // Render adds X-Forwarded-For; trust the single reverse-proxy hop.
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '24kb' }));
  app.use(rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false }));

  app.get('/health', (_request, response) => response.json({ ok: true }));
  app.post('/ai/analyze', async (request, response) => {
    if (!secret || request.header('authorization') !== `Bearer ${secret}`) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return response.status(503).json({ error: 'AI relay is not configured' });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45_000);
    try {
      const upstream = await fetchImpl(`${process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          ...(process.env.OPENROUTER_SITE_URL ? { 'HTTP-Referer': process.env.OPENROUTER_SITE_URL } : {}),
          ...(process.env.OPENROUTER_APP_NAME ? { 'X-Title': process.env.OPENROUTER_APP_NAME } : {}),
        },
        body: JSON.stringify(request.body),
        signal: controller.signal,
      });
      const body = await upstream.text();
      response.status(upstream.status).type(upstream.headers.get('content-type') || 'application/json').send(body);
    } catch (error) {
      const message = error instanceof Error && error.name === 'AbortError' ? 'AI relay timeout' : 'AI provider unavailable';
      response.status(502).json({ error: message });
    } finally {
      clearTimeout(timeout);
    }
  });

  return app;
}

if (process.env.NODE_ENV !== 'test') {
  const port = Number(process.env.PORT || 10000);
  createRelayApp().listen(port, '0.0.0.0', () => console.log(`AI relay listening on ${port}`));
}
