# Editorial Navigation Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the purple side-rail dashboard with a distinctive editorial interface and a responsive top navigation while preserving every existing ClientLens workflow.

**Architecture:** Introduce a focused `AppHeader` component for responsive global navigation and authentication entry points. Keep routing state in `App.tsx`, using an explicit auth intent only to select login or registration in the existing account panel. Replace the legacy CSS shell with a token-based graphite, cobalt and lime editorial system; business logic, API calls, reports and Supabase flows remain unchanged.

**Tech Stack:** React 19, TypeScript, Vite, CSS, Vitest, Testing Library, Supabase.

## Global Constraints

- Keep ClientLens a Russian-language working SaaS dashboard, not a marketing landing page.
- Preserve profile analysis, report history, demo, account, password change and avatar workflows.
- Top navigation must contain New analysis, My reports and Demo; no separate Settings route.
- Guests must see Registration and Login at the upper right; authenticated users must see an Account trigger with an avatar fallback.
- Use deep graphite, cobalt-blue, lime and coral status colors; avoid purple-first AI-styled gradients and excessive glass effects.
- Keep the interface usable on mobile via a compact accessible menu.
- Do not expose secrets or change server-side authentication/payment behavior.

---

### Task 1: Create the accessible application header

**Files:**
- Create: `src/components/AppHeader.tsx`
- Create: `src/components/AppHeader.test.tsx`

**Interfaces:**
- Produces `AppHeader({ activeView, reportCount, isAuthenticated, accountLabel, onNavigate, onAuth }: AppHeaderProps)`.
- `activeView` is `'new' | 'reports' | 'demo' | 'profile'`; `onNavigate` receives the same value; `onAuth` receives `'register' | 'login'`.

- [ ] **Step 1: Write the failing tests**

```tsx
render(<AppHeader activeView="new" reportCount={2} isAuthenticated={false} accountLabel="" onNavigate={onNavigate} onAuth={onAuth} />);
expect(screen.getByRole('button', { name: 'Регистрация' })).toBeTruthy();
expect(screen.getByRole('button', { name: 'Вход' })).toBeTruthy();
fireEvent.click(screen.getByRole('button', { name: /Мои отчёты/i }));
expect(onNavigate).toHaveBeenCalledWith('reports');
```

- [ ] **Step 2: Run the targeted test and verify it fails**

Run: `npm.cmd test -- src/components/AppHeader.test.tsx --run`

Expected: FAIL because `AppHeader` does not exist.

- [ ] **Step 3: Implement the minimal header**

```tsx
export function AppHeader({ activeView, reportCount, isAuthenticated, accountLabel, onNavigate, onAuth }: AppHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const go = (view: HeaderView) => { onNavigate(view); setMenuOpen(false); };
  return <header className="app-header">...</header>;
}
```

Render a branded home button, three primary navigation buttons, a report count badge, guest registration/login buttons, and an authenticated Account button with `accountLabel.slice(0, 1).toUpperCase()` as a fallback avatar. Add a mobile toggle with `aria-expanded` and close the menu after navigation.

- [ ] **Step 4: Run the targeted test and verify it passes**

Run: `npm.cmd test -- src/components/AppHeader.test.tsx --run`

Expected: PASS.

- [ ] **Step 5: Commit the tested component**

```bash
git add src/components/AppHeader.tsx src/components/AppHeader.test.tsx
git commit -m "feat: add responsive editorial header"
```

### Task 2: Connect header navigation to application state

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/auth/AccountPanel.tsx`

**Interfaces:**
- Consumes `AppHeader` from Task 1.
- Extends `AccountPanel` with `initialScreen?: 'login' | 'register'`; unauthenticated forms adopt that selection without changing signed-in profile/settings rendering.

- [ ] **Step 1: Write the failing account-screen test**

```tsx
render(<AccountPanel initialScreen="register" />);
expect(screen.getByRole('heading', { name: 'Создать аккаунт' })).toBeTruthy();
```

- [ ] **Step 2: Run the targeted test and verify it fails**

Run: `npm.cmd test -- src/auth/AccountPanel.test.tsx --run`

Expected: FAIL because `initialScreen` is not supported.

- [ ] **Step 3: Implement header integration and auth intent**

```tsx
const [authIntent, setAuthIntent] = useState<'login' | 'register'>('login');
const navigate = (next: HeaderView) => {
  if (next === 'demo') openDemo(); else setView(next);
};
<AppHeader activeView={view} reportCount={reports.length} isAuthenticated={Boolean(session)}
  accountLabel={session?.user.email ?? ''} onNavigate={navigate}
  onAuth={(intent) => { setAuthIntent(intent); setView('profile'); }} />
```

Remove the fixed `<aside>` and use `<main className="app"><AppHeader ... /><section className="content">...</section></main>`. Pass `initialScreen={authIntent}` to the profile panel. Keep the settings panel inside the Account view for signed-in users only.

- [ ] **Step 4: Run focused tests**

Run: `npm.cmd test -- src/auth/AccountPanel.test.tsx src/components/AppHeader.test.tsx --run`

Expected: PASS.

- [ ] **Step 5: Commit the integration**

```bash
git add src/App.tsx src/auth/AccountPanel.tsx src/auth/AccountPanel.test.tsx
git commit -m "feat: connect header account actions"
```

### Task 3: Apply the editorial visual system and responsive layout

**Files:**
- Modify: `src/styles.css`
- Modify: `src/monetization-overrides.css`
- Modify: `src/layout-overrides.css`

**Interfaces:**
- Consumes CSS class names from Tasks 1–2 and existing form/report/account components.
- Produces a desktop top-bar layout and a mobile dropdown navigation at `max-width: 760px`.

- [ ] **Step 1: Add CSS contract assertions to header test**

```tsx
expect(screen.getByRole('banner').className).toContain('app-header');
expect(screen.getByRole('navigation', { name: 'Основная навигация' })).toBeTruthy();
```

- [ ] **Step 2: Run the header test and verify it fails**

Run: `npm.cmd test -- src/components/AppHeader.test.tsx --run`

Expected: FAIL until semantic header and named navigation are present.

- [ ] **Step 3: Replace legacy purple shell styles**

Define CSS variables (`--ink`, `--surface`, `--line`, `--blue`, `--lime`, `--coral`, `--paper`) and style `.app`, `.app-header`, `.header-nav`, `.header-auth`, `.header-account`, `.content`, cards, forms, report ring, account avatar controls, notices and report grids. Use thin editorial borders, a subtle blue grid/spotlight background and clear typographic hierarchy. Remove all fixed side-rail selectors. At narrow widths keep the brand and menu toggle on one row, reveal `.header-nav` as an anchored column when open, and keep forms/cards one column.

- [ ] **Step 4: Run header test and static checks**

Run: `npm.cmd test -- src/components/AppHeader.test.tsx --run; npm.cmd run lint; npm.cmd run build`

Expected: all commands exit 0.

- [ ] **Step 5: Commit the visual redesign**

```bash
git add src/styles.css src/monetization-overrides.css src/layout-overrides.css src/components/AppHeader.test.tsx
git commit -m "feat: apply editorial dashboard design"
```

### Task 4: Verify full workflow and merge

**Files:**
- Modify only if verification exposes a concrete defect.

- [ ] **Step 1: Run full automated verification**

Run: `npm.cmd test -- --run; npm.cmd run lint; npm.cmd run build`

Expected: all test files pass and both static commands exit 0.

- [ ] **Step 2: Perform local visual smoke test**

Run: `npm.cmd run dev`

Expected: Vite provides a local URL; verify New analysis, reports, demo, guest auth actions, signed-in Account, mobile menu and account avatar controls render without console/runtime errors.

- [ ] **Step 3: Merge and publish**

```bash
git checkout main
git merge --no-ff feature/editorial-redesign
git push origin main
```

Expected: GitHub receives the changes and Render deploys from `main`.
