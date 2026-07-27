# ClientLens AI Relay

Private Render service that forwards validated analysis requests to OpenRouter. It does not persist profile data.

Required environment variables:

```env
OPENROUTER_API_KEY=
OPENROUTER_SITE_URL=https://clientlens.ru
OPENROUTER_APP_NAME=ClientLens
RELAY_SECRET=
```

Render uses `npm ci && npm run build:relay` and `npm run start:relay`. The VPS calls `POST /ai/analyze` with `Authorization: Bearer <RELAY_SECRET>`.
