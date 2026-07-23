# Public ClientLens Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add safe public-profile collection, competitor comparison, and Supabase-backed account/profile foundations to ClientLens.

**Architecture:** Express owns public-profile collection and analysis; it validates target URLs before outbound requests. Supabase owns identity, persisted user profile rows, and avatar objects, with browser-visible keys limited to the publishable key and row-level security enforced in migrations.

**Tech Stack:** React, TypeScript, Express, Zod, Supabase, PostgreSQL, Vitest.

## Global Constraints

- Accept only public Kwork, FL.ru and Freelance.ru profile URLs.
- Never put Supabase service-role, SMTP, OpenAI or session secrets in browser code.
- Require email confirmation; production SMTP remains a deployment prerequisite.
- Store only avatar image metadata, not payment card data.
- Use tests before production code.

---

### Task 1: Public-profile collection

**Files:** Create `server/profile-collection.ts`, `server/profile-collection.test.ts`; modify `server/index.ts`.

- [ ] Add failing tests for supported domain detection and rejection of private/internal URLs.
- [ ] Implement allowlisted URL validation, bounded HTML fetch, platform detection, and field extraction.
- [ ] Run collection tests.

### Task 2: Competitor comparison

**Files:** Create `src/scoring/competitive-analysis.ts`, `src/scoring/competitive-analysis.test.ts`; modify `src/domain/profile.ts`, `server/ai.ts`, `server/index.ts`.

- [ ] Add failing comparison test with a stronger competitor.
- [ ] Implement deterministic comparison and add it to report responses.
- [ ] Run comparison tests.

### Task 3: Auth and profile foundation

**Files:** Create `src/auth/supabase.ts`, `src/auth/AuthPanel.tsx`, `src/auth/ProfilePanel.tsx`, `supabase/migrations/001_profiles.sql`; modify `src/App.tsx`, `.env.example`.

- [ ] Add failing tests for configuration state and profile validation.
- [ ] Implement email/password signup, six-character OTP confirmation, login/logout, nickname and avatar UI.
- [ ] Add RLS migration and secure environment contract.
- [ ] Run auth tests.

### Task 4: Production hardening and verification

**Files:** Modify `server/index.ts`, `README.md`, `package.json`.

- [ ] Add security headers, request limits, rate limits, production port binding, health endpoint and generic error responses.
- [ ] Document Supabase, SMTP, DNS, Render deployment and mandatory secrets.
- [ ] Run tests, lint, build and dependency audit.
