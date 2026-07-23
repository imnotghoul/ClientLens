# FreelanceTrust Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a responsive browser-only MVP that audits a Kwork freelancer profile and returns actionable client-perspective recommendations.

**Architecture:** A Vite React shell owns the screen state. Pure domain and scoring modules convert a `ProfileInput` into a `ProfileAudit`; UI components only render and edit these typed values. `PlatformAnalyzer` is the extension seam for later API-backed analyzers.

**Tech Stack:** React 18, TypeScript, Vite, CSS modules/plain CSS, Vitest, Testing Library.

## Global Constraints

- Use local deterministic analysis only; do not fetch or scrape Kwork.
- Keep `PlatformAnalyzer`, scoring, editable criteria and UI in separate modules.
- Copy is Russian, neutral and concrete; no claims that a profile is bad.
- Design is a working SaaS dashboard, responsive from 320px, with one restrained teal accent.
- No external API key is required for startup, test or build.

---

## File structure

- `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html` — Vite app and scripts.
- `src/domain/profile.ts` — shared input, criteria and audit types.
- `src/analyzers/platform-analyzer.ts`, `src/analyzers/kwork-analyzer.ts` — extensible analysis contract and first implementation.
- `src/scoring/profile-scoring.ts`, `src/data/criteria.ts` — pure score and recommendation engine plus editable rules.
- `src/components/ProfileForm.tsx`, `Dashboard.tsx`, `ClientViews.tsx`, `ImprovementPanel.tsx` — focused UI blocks.
- `src/App.tsx`, `src/styles.css` — state orchestration and responsive visual system.
- `src/scoring/profile-scoring.test.ts` — scoring behavior tests.
- `README.md` — exact local run instructions and architecture overview.

### Task 1: Bootstrap the application

**Files:** Create `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/styles.css`.

**Interfaces:** Produces `App(): JSX.Element`, mounted at `#root`; scripts `dev`, `build`, `test`, `lint`.

- [ ] **Step 1: Add a failing smoke test**

```tsx
// src/App.test.tsx
import { render, screen } from '@testing-library/react';
import App from './App';
test('shows the audit workspace', () => {
  render(<App />);
  expect(screen.getByText(/глазами клиента/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Verify it fails**

Run: `npm test -- --run src/App.test.tsx`
Expected: FAIL because the project and `App` do not exist.

- [ ] **Step 3: Create minimal Vite setup and App**

```tsx
export default function App() {
  return <main><h1>Проверь, как твой Kwork-профиль выглядит глазами клиента</h1></main>;
}
```

- [ ] **Step 4: Verify green**

Run: `npm test -- --run src/App.test.tsx`
Expected: PASS.

### Task 2: Define the audit boundary and profile input

**Files:** Create `src/domain/profile.ts`, `src/analyzers/platform-analyzer.ts`, `src/analyzers/kwork-analyzer.ts`; Test `src/analyzers/kwork-analyzer.test.ts`.

**Interfaces:** Produces `type ProfileInput`, `type AnalysisGoal`, `interface PlatformAnalyzer { analyze(input: ProfileInput): ProfileAudit }`, `class KworkAnalyzer`.

- [ ] **Step 1: Write the failing Kwork normalization test**

```ts
import { KworkAnalyzer } from './kwork-analyzer';
test('keeps a manually supplied Kwork profile', () => {
  const audit = new KworkAnalyzer().analyze({ name: 'Аня', title: 'Дизайнер лендингов', description: '', services: '', price: '', reviews: '', completedOrders: 0, portfolio: '', profileUrl: 'https://kwork.ru/user/anya', extra: '', goal: 'orders' });
  expect(audit.platform).toBe('Kwork');
});
```

- [ ] **Step 2: Verify it fails**

Run: `npm test -- --run src/analyzers/kwork-analyzer.test.ts`
Expected: FAIL because the analyzer is missing.

- [ ] **Step 3: Implement typed contract and adapter**

```ts
export interface PlatformAnalyzer { analyze(input: ProfileInput): ProfileAudit; }
export class KworkAnalyzer implements PlatformAnalyzer {
  analyze(input: ProfileInput): ProfileAudit { return createProfileAudit(input, 'Kwork'); }
}
```

- [ ] **Step 4: Verify green**

Run: `npm test -- --run src/analyzers/kwork-analyzer.test.ts`
Expected: PASS.

### Task 3: Implement deterministic scoring

**Files:** Create `src/data/criteria.ts`, `src/scoring/profile-scoring.ts`; Modify `src/domain/profile.ts`; Test `src/scoring/profile-scoring.test.ts`.

**Interfaces:** Produces `createProfileAudit(input, platform): ProfileAudit` with `score`, `trust`, `orderLikelihood`, `barrier`, `issues`, `quickWins`, `clientViews` and `improvements`.

- [ ] **Step 1: Write failing score behavior tests**

```ts
import { createProfileAudit } from './profile-scoring';
const base = { name: '', title: '', description: '', services: '', price: '', reviews: '', completedOrders: 0, portfolio: '', profileUrl: '', extra: '', goal: 'orders' as const };
test('flags missing proof on a sparse profile', () => {
  expect(createProfileAudit(base, 'Kwork').issues.some((x) => /довер/i.test(x.title))).toBe(true);
});
test('scores a documented profile higher than a sparse one', () => {
  const rich = { ...base, name: 'Аня', title: 'UX-дизайнер SaaS с опытом B2B', description: 'Проектирую интерфейсы для B2B, показываю путь пользователя и результат.', services: 'Аудит, UX/UI дизайн', price: '25 000 ₽', reviews: '47 отзывов, 5.0', completedOrders: 64, portfolio: '3 кейса: рост конверсии и сокращение ошибок' };
  expect(createProfileAudit(rich, 'Kwork').score).toBeGreaterThan(createProfileAudit(base, 'Kwork').score);
});
```

- [ ] **Step 2: Verify red**

Run: `npm test -- --run src/scoring/profile-scoring.test.ts`
Expected: FAIL because the scorer is missing.

- [ ] **Step 3: Implement score rules and editable text rules**

```ts
const points = [has(input.title, 16), has(input.description, 16), has(input.services, 10), has(input.portfolio, 14), has(input.reviews, 14), Boolean(input.completedOrders) ? 10 : 0, has(input.price, 8)];
const score = Math.min(100, 12 + points.reduce((sum, value) => sum + value, 0));
```

Return five prioritized issues, five quick wins, 10-minute and one-day actions, client views and before/after copy derived from absent fields and selected `goal`.

- [ ] **Step 4: Verify green**

Run: `npm test -- --run src/scoring/profile-scoring.test.ts`
Expected: PASS.

### Task 4: Build the input workspace

**Files:** Create `src/components/ProfileForm.tsx`; Modify `src/App.tsx`; Test `src/components/ProfileForm.test.tsx`.

**Interfaces:** Consumes `ProfileInput`; produces `ProfileForm({ onAnalyze(input: ProfileInput): void }): JSX.Element`.

- [ ] **Step 1: Write failing interaction test**

```tsx
test('submits manual data with the selected goal', async () => {
  const onAnalyze = vi.fn();
  render(<ProfileForm onAnalyze={onAnalyze} />);
  await userEvent.type(screen.getByLabelText(/заголовок/i), 'Дизайнер лендингов');
  await userEvent.click(screen.getByRole('button', { name: /запустить анализ/i }));
  expect(onAnalyze).toHaveBeenCalledWith(expect.objectContaining({ title: 'Дизайнер лендингов' }));
});
```

- [ ] **Step 2: Verify red**

Run: `npm test -- --run src/components/ProfileForm.test.tsx`
Expected: FAIL because the form is missing.

- [ ] **Step 3: Implement the form**

Include Kwork URL input, manual-mode toggle, all requested text/number fields, five goal buttons, visible validation for an entirely empty submission and an accessible submit control. URL is accepted as context only; never fetched.

- [ ] **Step 4: Verify green**

Run: `npm test -- --run src/components/ProfileForm.test.tsx`
Expected: PASS.

### Task 5: Build dashboard and recommendation views

**Files:** Create `src/components/Dashboard.tsx`, `src/components/ClientViews.tsx`, `src/components/ImprovementPanel.tsx`; Modify `src/App.tsx`, `src/styles.css`; Test `src/components/Dashboard.test.tsx`.

**Interfaces:** Consumes `ProfileAudit`; produces cards for score, trust, likelihood, barrier, issues, actions, client tabs and improvements.

- [ ] **Step 1: Write failing dashboard rendering test**

```tsx
test('shows the order barrier and client views', () => {
  render(<Dashboard audit={fixtureAudit} onRestart={() => {}} />);
  expect(screen.getByText(/главный барьер/i)).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: /осторожный/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Verify red**

Run: `npm test -- --run src/components/Dashboard.test.tsx`
Expected: FAIL because the dashboard is missing.

- [ ] **Step 3: Implement accessible dashboard UI**

Render a score ring, trust scale, probability label, five issues and quick wins, time-based actions, five ARIA tabs each with liked/doubt/no-message/fix content, and generated headline/description/remove/add/portfolio/price/structure/before-after blocks. Add `aria-live` loading state before the report and responsive CSS grid.

- [ ] **Step 4: Verify green**

Run: `npm test -- --run src/components/Dashboard.test.tsx`
Expected: PASS.

### Task 6: Document and validate the MVP

**Files:** Create `README.md`; Modify `package.json` if needed.

- [ ] **Step 1: Write README acceptance checklist**

Document Node version, `npm install`, `npm run dev`, `npm test`, `npm run build`, the localhost URL, architecture boundaries and the no-scraping limitation.

- [ ] **Step 2: Run all checks**

Run: `npm test -- --run && npm run lint && npm run build`
Expected: all commands exit 0.

- [ ] **Step 3: Run local server**

Run: `npm run dev -- --host 127.0.0.1`
Expected: Vite reports a local URL, normally `http://127.0.0.1:5173/`.

## Plan self-review

- Coverage: Tasks 2–3 implement extensible analyzers, local scoring and editable criteria; Task 4 covers link/manual entry and all goals; Task 5 covers dashboard, client perspectives, improvements, states and adaptive UI; Task 6 covers README, checks and local server.
- Placeholder scan: no deferred requirements or undefined interfaces remain.
- Type consistency: `ProfileInput` flows from `ProfileForm` through `KworkAnalyzer` to `ProfileAudit`, which is consumed by dashboard components.
