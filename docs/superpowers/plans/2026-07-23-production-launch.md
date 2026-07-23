# ClientLens Production Launch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make ClientLens deployable as one secure Node.js service and persist authenticated users' reports.

**Architecture:** Express will serve `dist/` in production and keep `/api` on the same origin. Supabase remains the authentication and profile database; a new RLS-protected `audits` table stores only the authenticated owner's reports. Legal pages are static React views.

**Tech Stack:** React, Vite, Express, Supabase PostgreSQL/Auth, Vitest, TypeScript.

## Global Constraints

- Never expose `OPENAI_API_KEY`, Supabase service-role keys, database passwords, or SMTP credentials to the browser.
- Analyses require an authenticated Supabase session.
- Do not add payment processing or store payment details.
- Keep the fallback local analysis usable when OpenAI is unavailable.

---

### Task 1: Production server entry point

**Files:**
- Modify: `server/index.ts`
- Modify: `package.json`
- Test: `server/production-server.test.ts`

- [ ] Write a failing test for exported `isProduction()` with `NODE_ENV=production`.
- [ ] Add `isProduction()` and `express.static(dist)` after API routes; return `dist/index.html` for non-API routes.
- [ ] Add `start` script: `node --import tsx server/index.ts`.
- [ ] Run `npm.cmd test -- --run server/production-server.test.ts` and `npm.cmd run build`.

### Task 2: Persistent reports with row-level security

**Files:**
- Create: `supabase/migrations/002_audits.sql`
- Create: `src/storage/cloud-report-store.ts`
- Modify: `src/App.tsx`
- Test: `src/storage/cloud-report-store.test.ts`

- [ ] Write failing tests for serializing a report without browser-only state.
- [ ] Add `audits` table with `user_id`, report payload JSONB, timestamps, index and RLS owner policies.
- [ ] Save and list reports with the authenticated Supabase user; preserve local cache as offline fallback.
- [ ] Run the focused test and full test suite.

### Task 3: Account recovery and public documents

**Files:**
- Modify: `src/auth/AccountPanel.tsx`
- Create: `src/components/LegalPage.tsx`
- Modify: `src/App.tsx`
- Test: `src/auth/supabase.test.ts`

- [ ] Write a failing test for allowed password-reset redirect origin.
- [ ] Add a password-reset request flow with non-enumerating user message.
- [ ] Add Privacy Policy and Terms views that disclose profile URLs, reports, account email, OpenAI processing and deletion contact placeholder.
- [ ] Run lint and full tests.

### Task 4: Deployment documentation and verification

**Files:**
- Modify: `README.md`
- Modify: `.env.example`

- [ ] Document Render build/start commands, production environment variables, Supabase URL configuration, SMTP, and domain DNS hand-off.
- [ ] Explicitly document that the service role key is not needed by this app.
- [ ] Run `npm.cmd test -- --run`, `npm.cmd run lint`, `npm.cmd run build`, and `npm.cmd run start` with a health check.
