# Profile Identity Header Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render a current user’s real profile identity in the global Account trigger and clarify competitor inputs.

**Architecture:** A pure profile-presentation module maps the Supabase `profiles` row into display data. `App` owns profile identity and gives Account a refresh callback, keeping the account card and top header in sync.

**Tech Stack:** React, TypeScript, Supabase client, Vitest, Testing Library.

## Global Constraints

- Never derive an account-avatar initial from an email address.
- Preserve existing nickname uniqueness, avatar file restrictions and Supabase RLS behavior.
- Do not change analysis, reports, payment, or server-side behavior.

---

### Task 1: Add profile presentation mapping

**Files:**
- Create: `src/auth/profile-presentation.ts`
- Create: `src/auth/profile-presentation.test.ts`

**Interfaces:**
- Produces `toProfilePresentation(row, publicUrl): ProfilePresentation | null`.
- `ProfilePresentation` is `{ nickname: string; avatarUrl: string }`.

- [ ] **Step 1: Write the failing test**

```ts
expect(toProfilePresentation({ nickname: 'aegis', avatar_path: 'id/avatar.png' }, 'https://cdn/avatar.png'))
  .toEqual({ nickname: 'aegis', avatarUrl: 'https://cdn/avatar.png' });
expect(toProfilePresentation(null, '')).toBeNull();
```

- [ ] **Step 2: Run it and verify it fails**

Run: `npm.cmd test -- src/auth/profile-presentation.test.ts --run`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the mapping**

```ts
export function toProfilePresentation(row: ProfileRow | null, publicUrl: string): ProfilePresentation | null {
  if (!row) return null;
  return { nickname: row.nickname ?? '', avatarUrl: row.avatar_path ? publicUrl : '' };
}
```

- [ ] **Step 4: Verify it passes and commit**

Run: `npm.cmd test -- src/auth/profile-presentation.test.ts --run`

```bash
git add src/auth/profile-presentation.ts src/auth/profile-presentation.test.ts
git commit -m "feat: map profile identity for header"
```

### Task 2: Load and refresh header identity

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/AppHeader.tsx`
- Modify: `src/components/AppHeader.test.tsx`
- Modify: `src/auth/AccountPanel.tsx`
- Modify: `src/components/ProfileForm.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Extends `AppHeaderProps` with `avatarUrl: string` and `identityReady: boolean`.
- Extends `AccountPanel` with `onProfileChanged?: () => void`.

- [ ] **Step 1: Write the failing header test**

```tsx
render(<AppHeader activeView="new" reportCount={0} isAuthenticated avatarUrl="https://cdn/avatar.png" identityReady accountLabel="aegis" onNavigate={vi.fn()} onAuth={vi.fn()} />);
expect(screen.getByRole('img', { name: 'Аватар аккаунта' })).toHaveAttribute('src', 'https://cdn/avatar.png');
```

- [ ] **Step 2: Run it and verify it fails**

Run: `npm.cmd test -- src/components/AppHeader.test.tsx --run`

Expected: FAIL because avatar props are unsupported.

- [ ] **Step 3: Implement shared identity state**

`App` fetches `nickname, avatar_path` for the active session, makes a public Storage URL, and passes identity to `AppHeader`. The header renders a neutral pending circle while loading, an image when `avatarUrl` exists, or a nickname initial only after the profile lookup completes. Account invokes `onProfileChanged` after a successful nickname/avatar mutation.

- [ ] **Step 4: Rename competitor placeholders**

Use `Название услуги или предложение` and `Цена, отзывы или кейсы`.

- [ ] **Step 5: Run focused tests and commit**

Run: `npm.cmd test -- src/auth/profile-presentation.test.ts src/components/AppHeader.test.tsx src/auth/AccountPanel.test.tsx --run`

```bash
git add src/App.tsx src/components/AppHeader.tsx src/components/AppHeader.test.tsx src/auth/AccountPanel.tsx src/components/ProfileForm.tsx src/styles.css
git commit -m "feat: show profile avatar in account header"
```

### Task 3: Verify and publish

- [ ] **Step 1: Run verification**

Run: `npm.cmd test -- --run; npm.cmd run lint; npm.cmd run build`

Expected: all commands exit 0.

- [ ] **Step 2: Merge and publish**

Run:

```bash
git checkout main
git merge --no-ff feature/profile-identity-header
git push origin main
```
