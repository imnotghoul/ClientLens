# Newcomers Content and First Luna Offer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public “Новичкам” resource section with five practical guides and make the first authenticated quick Luna analysis visibly free.

**Architecture:** Keep guide copy in a typed static data module and render it through a focused React page. Extend the existing in-memory view routing and persisted view allow-list without introducing a router or CMS. Treat the first free Luna request as a per-account browser entitlement keyed by the Supabase user id; consume it only after a successful analysis result is saved, so retries after a network error remain possible.

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library, existing localStorage view/report stores.

## Global Constraints

- The section is public and requires no remote request, CMS, comments, search, or email collection.
- Copy is Russian, calm, concrete, and makes no guaranteed-order promises.
- The route/view id is `newcomers` and refreshes must preserve it through the existing saved-view mechanism.
- Mobile cards use one column and guide text must not require horizontal scrolling.
- The first free offer applies only to `quick` + `gpt-5.6-luna` for the current authenticated user.
- Do not modify unrelated dirty Supabase migration files.

### Task 1: Add typed newcomer guide content

**Files:**
- Create: `src/data/newcomer-guides.ts`
- Test: `src/data/newcomer-guides.test.ts`

**Interfaces:**
- Produces `NewcomerGuide` and `newcomerGuides` for the page component.

- [ ] **Step 1: Write the failing content test**

```ts
import { describe, expect, it } from 'vitest';
import { newcomerGuides } from './newcomer-guides';

describe('newcomer guides', () => {
  it('contains five complete guides with examples and checklists', () => {
    expect(newcomerGuides).toHaveLength(5);
    for (const guide of newcomerGuides) {
      expect(guide.title.length).toBeGreaterThan(10);
      expect(guide.problem.length).toBeGreaterThan(20);
      expect(guide.fixes.length).toBeGreaterThanOrEqual(3);
      expect(guide.checklist.length).toBeGreaterThanOrEqual(3);
    }
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm.cmd test -- --run src/data/newcomer-guides.test.ts`
Expected: FAIL because `src/data/newcomer-guides.ts` does not exist.

- [ ] **Step 3: Add the static guide data**

Create a `NewcomerGuide` type with `id`, `title`, `summary`, `problem`, `fixes`, optional `example` (`before`/`after`), and `checklist`. Populate all five user-requested topics with actionable, non-guaranteed Russian copy.

- [ ] **Step 4: Run the test and verify it passes**

Run: `npm.cmd test -- --run src/data/newcomer-guides.test.ts`
Expected: PASS.

### Task 2: Build the newcomers page

**Files:**
- Create: `src/components/NewcomersPage.tsx`
- Create: `src/components/NewcomersPage.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes `newcomerGuides`.
- Exports `NewcomersPage({ onAnalyze }: { onAnalyze: () => void })`.

- [ ] **Step 1: Write failing component tests**

```tsx
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NewcomersPage } from './NewcomersPage';

afterEach(cleanup);

describe('NewcomersPage', () => {
  it('renders five guide cards and opens a selected guide', () => {
    render(<NewcomersPage onAnalyze={vi.fn()} />);
    expect(screen.getAllByRole('button', { name: /Открыть материал/i })).toHaveLength(5);
    fireEvent.click(screen.getAllByRole('button', { name: /Открыть материал/i })[1]);
    expect(screen.getByRole('heading', { name: /нет отзывов/i })).toBeTruthy();
  });

  it('returns to analysis from the guide CTA', () => {
    const onAnalyze = vi.fn();
    render(<NewcomersPage onAnalyze={onAnalyze} />);
    fireEvent.click(screen.getByRole('button', { name: /перейти к анализу/i }));
    expect(onAnalyze).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run tests and verify they fail**

Run: `npm.cmd test -- --run src/components/NewcomersPage.test.tsx`
Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the page**

Render a page heading, an intro, a responsive `.newcomers-grid` of cards, and a detail panel selected to the first guide by default. Each card button updates local state. The detail panel renders problem, numbered fixes, optional before/after example, checklist, and a `Перейти к анализу` button that calls `onAnalyze`.

- [ ] **Step 4: Add responsive expressive styles**

Add scoped `.newcomers-*` rules using existing dark surface, line, blue, lime, and purple-compatible tokens. Use two/three columns on wide screens and one column below `720px`; allow long Russian text to wrap.

- [ ] **Step 5: Run component tests**

Run: `npm.cmd test -- --run src/components/NewcomersPage.test.tsx`
Expected: PASS.

### Task 3: Wire the new view into navigation and persistence

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/AppHeader.tsx`
- Modify: `src/components/AppHeader.test.tsx`
- Modify: `src/storage/view-store.ts`
- Modify: `src/legal/initial-view.ts` only if TypeScript requires a shared view type update

**Interfaces:**
- `HeaderView` and `View` both include `'newcomers'`.
- `AppHeader` emits `onNavigate('newcomers')`.

- [ ] **Step 1: Extend the header test**

Add an assertion that the `Новичкам` button exists and clicking it calls `onNavigate` with `'newcomers'`.

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm.cmd test -- --run src/components/AppHeader.test.tsx`
Expected: FAIL because the navigation entry is absent.

- [ ] **Step 3: Wire the view**

Add `newcomers` to the app/header unions and saved view list, add the header link, map `activeHeaderView` correctly, and render `<NewcomersPage onAnalyze={() => setView('new')} />` in `App.tsx`. Keep the root path behavior unchanged: `/` still opens the analysis form.

- [ ] **Step 4: Run focused tests**

Run: `npm.cmd test -- --run src/components/AppHeader.test.tsx src/storage/view-store.test.ts src/legal/initial-view.test.ts`
Expected: PASS.

### Task 4: Add the first quick Luna free entitlement

**Files:**
- Create: `src/storage/free-analysis-store.ts`
- Create: `src/storage/free-analysis-store.test.ts`
- Modify: `src/components/ProfileForm.tsx`
- Modify: `src/components/ProfileForm.test.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- `hasUsedFreeQuickLuna(userId: string): boolean`
- `markFreeQuickLunaUsed(userId: string): void`
- `ProfileForm` receives `freeQuickLunaAvailable?: boolean`.

- [ ] **Step 1: Write failing entitlement tests**

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { hasUsedFreeQuickLuna, markFreeQuickLunaUsed } from './free-analysis-store';

describe('free quick Luna entitlement', () => {
  beforeEach(() => localStorage.clear());
  it('starts available and becomes used only for the same account', () => {
    expect(hasUsedFreeQuickLuna('user-a')).toBe(false);
    markFreeQuickLunaUsed('user-a');
    expect(hasUsedFreeQuickLuna('user-a')).toBe(true);
    expect(hasUsedFreeQuickLuna('user-b')).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm.cmd test -- --run src/storage/free-analysis-store.test.ts`
Expected: FAIL because the store does not exist.

- [ ] **Step 3: Implement the store and form pricing state**

Use a namespaced localStorage key `clientlens-free-quick-luna-v1:<userId>`. In `ProfileForm`, derive the displayed price as `0 ₽` only when `mode === 'quick'`, `model === 'gpt-5.6-luna'`, and `freeQuickLunaAvailable` is true; show copy `Первый быстрый анализ Luna — бесплатно` and otherwise keep `getAnalysisPrice` unchanged. Do not alter deep or competitive prices.

- [ ] **Step 4: Consume the entitlement after a successful result**

In `App.tsx`, compute availability from `session.user.id`, pass it to `ProfileForm`, and call `markFreeQuickLunaUsed(session.user.id)` immediately after `requestAnalysis` succeeds and the report is saved. A fallback report after an API failure does not consume the free AI offer.

- [ ] **Step 5: Add form assertions and run tests**

Verify the free label/zero price appears only for the matching mode/model and that the existing “not advertise a free Luna request” expectation is updated to the new requirement. Run: `npm.cmd test -- --run src/storage/free-analysis-store.test.ts src/components/ProfileForm.test.tsx`
Expected: PASS.

### Task 5: Full verification and commit

**Files:**
- No additional files; review all files changed in Tasks 1–4.

- [ ] **Step 1: Run all tests**

Run: `npm.cmd test -- --run`
Expected: all tests pass.

- [ ] **Step 2: Run lint**

Run: `npm.cmd run lint`
Expected: exit code 0 with no warnings.

- [ ] **Step 3: Run production build**

Run: `npm.cmd run build`
Expected: Vite production build completes successfully.

- [ ] **Step 4: Inspect the diff for scope safety**

Run: `git status --short` and `git diff --check`; confirm unrelated Supabase migration changes remain untouched and no secrets are present.

- [ ] **Step 5: Commit the feature**

```bash
git add src/data/newcomer-guides.ts src/data/newcomer-guides.test.ts src/components/NewcomersPage.tsx src/components/NewcomersPage.test.tsx src/components/AppHeader.tsx src/components/AppHeader.test.tsx src/App.tsx src/storage/view-store.ts src/storage/free-analysis-store.ts src/storage/free-analysis-store.test.ts src/components/ProfileForm.tsx src/components/ProfileForm.test.tsx src/styles.css
git commit -m "feat: add newcomers guides and first Luna offer"
```
