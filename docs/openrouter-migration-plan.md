# OpenRouter migration plan

## Goal

Перевести серверный AI-анализ ClientLens с OpenAI Responses API на OpenRouter Chat Completions, сохранив локальный scoring и fallback.

## Configuration

Server-only variables:

- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL_LUNA`
- `OPENROUTER_MODEL_TERRA`
- `OPENROUTER_MODEL_SOL`
- `OPENROUTER_SITE_URL` (optional)
- `OPENROUTER_APP_NAME` (optional)

The existing `OPENAI_*` variables will no longer be required. No API key will be exposed to the browser.

## Runtime behavior

1. Validate and trim the profile before sending it.
2. Skip OpenRouter when the profile is empty or the key/model is missing.
3. Send one request to `/api/v1/chat/completions` with the existing system prompt and JSON schema.
4. Validate the returned report with the existing report parser.
5. Use the local report builder for any OpenRouter, network, quota, or parsing failure.
6. Keep the UI model names Luna/Terra/Sol; their values are configurable OpenRouter model IDs.

## OpenRouter setup

The user creates an OpenRouter account, adds credits if paid models are selected, creates one API key, and puts it only into the server `.env`. Models are selected by their exact OpenRouter IDs and can be changed without code edits.

## Verification

Run tests and production build locally, then update the VPS environment, rebuild, restart PM2, and verify both the AI and fallback paths.
