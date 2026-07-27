# ClientLens AI Relay Design

## Goal

Move only outbound OpenRouter requests to a small Render Web Service because the current VPS IP is rejected by OpenRouter security policy. The public ClientLens site, authentication, payments, and fallback analysis remain on the existing VPS.

## Architecture

The VPS API sends a profile and selected model to a private relay endpoint on Render. The relay validates a shared secret, applies input limits, calls OpenRouter with its server-only API key, and returns the structured AI report. The VPS keeps the existing local scoring and uses it whenever the relay is unavailable, times out, rejects the request, or returns invalid JSON.

## Security

- `OPENROUTER_API_KEY` exists only in Render environment variables.
- `AI_RELAY_SECRET` is shared only between the VPS and Render.
- The relay rejects requests without the secret and limits JSON body size and request frequency.
- The browser never calls Render and never receives either secret.
- No profile data is persisted by the relay.

## Models

- `openai/gpt-5.6-luna`
- `openai/gpt-5.6-terra`
- `openai/gpt-5.6-sol`

## Failure behavior

Any non-2xx response, timeout, unavailable relay, malformed response, or invalid report is converted into the existing basic local analysis. The UI continues to show a useful report and identifies it as basic analysis.

## Deployment

Render runs the relay from the repository `relay` directory using Node.js. Required Render variables are `OPENROUTER_API_KEY`, `OPENROUTER_SITE_URL`, `OPENROUTER_APP_NAME`, and `RELAY_SECRET`. The VPS receives `AI_RELAY_URL` and `AI_RELAY_SECRET`.

## Acceptance criteria

1. Relay health endpoint responds with `{ ok: true }`.
2. Requests without the relay secret return `401`.
3. A valid request reaches OpenRouter and returns the existing structured report shape.
4. VPS analysis uses AI when relay succeeds.
5. VPS analysis falls back to local scoring when relay fails.
6. OpenRouter and relay secrets are absent from frontend bundles and Git history.
