# Profile Avatar Header Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a profile-header avatar with a nickname fallback.

**Architecture:** Reuse `nickname` and `avatar` state from `AccountPanel`. A small fallback helper gives the header a stable initial, while CSS positions the visual in the header without changing storage or upload behavior.

**Tech Stack:** React, TypeScript, CSS, Vitest.

## Global Constraints

- Do not add new personal data or change Supabase policies.
- Keep existing avatar upload restrictions unchanged.
- Support a narrow mobile layout.

---

### Task 1: Header avatar

**Files:**
- Modify: `src/auth/supabase.ts`
- Modify: `src/auth/supabase.test.ts`
- Modify: `src/auth/AccountPanel.tsx`
- Modify: `src/monetization-overrides.css`

- [ ] Write a failing test:

```ts
expect(profileAvatarLetter('aegis')).toBe('A');
expect(profileAvatarLetter('')).toBe('C');
```

- [ ] Run `npm.cmd test -- --run src/auth/supabase.test.ts` and confirm it fails because `profileAvatarLetter` is absent.
- [ ] Add `profileAvatarLetter`, render an image or fallback circle in `.profile-header`, and add the responsive CSS rules.
- [ ] Run `npm.cmd test -- --run src/auth/supabase.test.ts` and `npm.cmd run build`.
