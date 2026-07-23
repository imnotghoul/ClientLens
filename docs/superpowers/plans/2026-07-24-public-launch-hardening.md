# ClientLens Public Launch Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent direct unauthenticated analysis requests and make the Node service safer to publish without payments or an OpenAI key.

**Architecture:** The client forwards the current Supabase access token to the same-origin API. A small server authentication module validates it with Supabase before `/api/analyze` processes profile URLs. Helmet enables a production CSP and the analysis route receives its own rate limit.

**Tech Stack:** React, TypeScript, Vite, Express, Supabase JS, Vitest.

## Global Constraints

- Never expose or commit secrets.
- Keep fallback analysis working when `OPENAI_API_KEY` is absent.
- Do not add payment functionality.

### Task 1: Authenticated analysis boundary

**Files:** `server/auth.ts`, `server/auth.test.ts`, `server/index.ts`, `src/api/analyze.ts`, `src/App.tsx`

- [ ] Add failing unit tests for missing/malformed Bearer values and a verified user.
- [ ] Validate the Supabase JWT server-side before collecting a profile or calling AI.
- [ ] Send the existing browser session access token with the analysis request.
- [ ] Add a stricter route-specific rate limit and human-readable `401` response.

### Task 2: Production headers and docs

**Files:** `server/index.ts`, `README.md`, `.env.example`

- [ ] Enable a restrictive CSP compatible with Supabase and existing Google fonts.
- [ ] Document separate server-side Supabase variables and public launch configuration.

### Task 3: Verification

**Files:** all above

- [ ] Run focused tests, full tests, lint, and production build.
- [ ] Run the server in production mode and check `/api/health`.
