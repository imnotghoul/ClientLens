# ClientLens public launch hardening

## Goal

Publish ClientLens without payments and without an OpenAI API key. Visitors must sign in before any analysis request reaches the server; the site remains useful through the local fallback report.

## Design

The React client sends the signed-in Supabase access token only to the same-origin `/api/analyze` endpoint. Express verifies that token through Supabase before collecting an external profile or creating a report. Requests without a valid token get `401`; the endpoint also has a stricter per-window limit than general API routes.

Express keeps Helmet protections enabled with a CSP that permits only the ClientLens origin, Supabase, and the existing Google font sources. Profile collection stays limited to the three marketplace host allowlists and retains its timeout and response-size limit. No payment data, OpenAI key, SMTP credential, service role key, or database password is added to browser code.

## Public-release checklist

- Run Supabase migrations `001` through `005`, then configure CAPTCHA, production URLs and custom SMTP.
- Deploy one Node service to Render with `NODE_ENV=production`, public Supabase URL/key, and no `OPENAI_API_KEY` initially.
- Add the Render DNS records at Reg.ru and update Supabase Site URL after HTTPS becomes active.
- Verify registration, email confirmation, login, password change, avatar upload, basic analysis, report persistence, privacy page, and terms page.

## Deferred scope

YooKassa, SBP/cards, purchase state, OpenAI API billing, and AI access credits are deliberately excluded until the business account and payment provider are ready.
