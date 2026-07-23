# Account Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist app view, simplify profile controls, secure password change with OTP, and repair profile table grants.

**Architecture:** A storage helper validates/restores view identifiers. Account controls stay client-side through Supabase Auth; password change first verifies the current password, sends an email OTP, then uses `updateUser`. RLS remains the row guard while PostgreSQL grants allow authenticated requests to reach it.

**Tech Stack:** React, TypeScript, Supabase Auth/PostgreSQL, Vitest.

## Global Constraints

- No payment fields or real payment processing.
- No secrets in the browser.
- Password OTP accepts eight digits.

---

### Task 1: Persistent navigation and database grant migration

**Files:**
- Create: `src/storage/view-store.ts`, `src/storage/view-store.test.ts`, `supabase/migrations/003_authenticated_grants.sql`
- Modify: `src/App.tsx`

- [ ] Test invalid and valid stored views.
- [ ] Add validated local-storage get/set helpers and use them from `App`.
- [ ] Add owner-preserving grants for profiles and audits.

### Task 2: Profile and settings controls

**Files:**
- Modify: `src/auth/AccountPanel.tsx`, `src/monetization-overrides.css`

- [ ] Test OTP normalisation remains eight digits.
- [ ] Make avatar click trigger a hidden file input; remove visible upload field and profile payment block.
- [ ] Add settings view with visual payment placeholder and password verification, email OTP confirmation, and password update.

### Task 3: Verification

- [ ] Run `npm.cmd test -- --run`, `npm.cmd run lint`, and `npm.cmd run build`.
