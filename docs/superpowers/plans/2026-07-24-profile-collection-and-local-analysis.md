# Profile Collection and Local Analysis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make ClientLens accept Kwork, FL.ru, and Freelance.ru profile links without Kwork-only copy, and make the no-AI report adapt its recommendations to actual profile signals.

**Architecture:** Keep all public-page fetching on the Express server. `server/profile-collection.ts` remains the single allowlist and metadata-first extractor, while `server/index.ts` passes the detected platform through the analysis pipeline. `src/scoring/profile-scoring.ts` stays deterministic but derives issues and action lists from a reusable signal map rather than fixed generic arrays.

**Tech Stack:** React 19, TypeScript, Vite, Express, Vitest, Testing Library.

## Global Constraints

- Accept only public HTTP(S) URLs on Kwork, FL.ru, and Freelance.ru; do not bypass login, CAPTCHA, robots restrictions, or access controls.
- Keep URL length, response-size and timeout limits in the server collector.
- Preserve the server-side OpenAI fallback and never expose API secrets to the browser.
- Use neutral marketplace language in generic copy; only show a marketplace name when the URL was actually identified.
- Keep manual input available when collection is incomplete or fails.
- Complete every behavior change test-first with `npm.cmd test -- --run <test file>`.

---

### Task 1: Propagate the detected marketplace into local and AI reports

**Files:**
- Modify: `server/profile-collection.ts`
- Modify: `server/profile-collection.test.ts`
- Modify: `server/ai.ts`
- Modify: `server/ai.test.ts`
- Modify: `server/index.ts`
- Modify: `server/prompt.ts`

**Interfaces:**
- Consumes: `CollectedProfile.platform: PlatformId` from `collectPublicProfile`.
- Produces: `platformLabel(platform?: PlatformId): string` and `analyzeWithAi(profile, options)` where `options` contains `model?: AiModel` and `platform?: string`.
- Produces: a `ProfileAudit.platform` equal to `Kwork`, `FL.ru`, or `Freelance.ru` for a successfully collected URL; manual profiles use `Профиль фрилансера`.

- [ ] **Step 1: Write the failing platform-label tests**

Add to `server/profile-collection.test.ts`:

```ts
import { detectPlatform, platformLabel, validatePublicProfileUrl } from './profile-collection';

it('uses human-readable names for every supported marketplace', () => {
  expect(platformLabel('kwork')).toBe('Kwork');
  expect(platformLabel('flru')).toBe('FL.ru');
  expect(platformLabel('freelanceRu')).toBe('Freelance.ru');
  expect(platformLabel()).toBe('Профиль фрилансера');
});
```

- [ ] **Step 2: Run the collector test to verify it fails**

Run: `npm.cmd test -- --run server/profile-collection.test.ts`

Expected: FAIL because `platformLabel` is not exported.

- [ ] **Step 3: Add the single platform-label mapping**

Add to `server/profile-collection.ts` after `PlatformId`:

```ts
const platformLabels: Record<PlatformId, string> = {
  kwork: 'Kwork',
  flru: 'FL.ru',
  freelanceRu: 'Freelance.ru',
};

export const platformLabel = (platform?: PlatformId): string =>
  platform ? platformLabels[platform] : 'Профиль фрилансера';
```

- [ ] **Step 4: Run the collector test to verify it passes**

Run: `npm.cmd test -- --run server/profile-collection.test.ts`

Expected: PASS.

- [ ] **Step 5: Write a failing fallback-platform test**

Add to `server/ai.test.ts`:

```ts
it('keeps the collected marketplace in a local fallback report', () => {
  const result = buildFallbackResponse({ ...emptyProfile, title: 'UX-аудит' }, 'Базовый анализ', 'FL.ru');
  expect(result.audit.platform).toBe('FL.ru');
});
```

- [ ] **Step 6: Run the AI test to verify it fails**

Run: `npm.cmd test -- --run server/ai.test.ts`

Expected: FAIL because `buildFallbackResponse` accepts only two arguments.

- [ ] **Step 7: Carry platform through the analysis boundary**

In `server/ai.ts`, introduce the explicit options type and remove hard-coded Kwork labels:

```ts
type AnalyzeOptions = {
  model?: 'gpt-5.6-luna' | 'gpt-5.6-terra' | 'gpt-5.6-sol';
  platform?: string;
};

export const buildFallbackResponse = (
  partial: Partial<ProfileInput>,
  notice: string,
  platform = 'Профиль фрилансера',
): AnalysisResponse => ({
  audit: { ...createProfileAudit(completeProfile(partial), platform), analysisMode: 'basic', analysisSummary: notice },
  mode: 'basic',
  notice,
});
```

Change `analyzeWithAi` to accept `options: AnalyzeOptions = {}` and use `options.platform ?? 'Профиль фрилансера'` in every `createProfileAudit` and `buildFallbackResponse` call. Replace the AI user message with `Профиль фрилансера на ${platform}:` and rename the JSON schema label from `kwork_profile_audit` to `freelance_profile_audit`.

In `server/index.ts`, import `platformLabel`, derive `const platform = platformLabel(collected?.platform);`, and call `analyzeWithAi(profile, { model, platform })`.

In `server/prompt.ts`, replace the Kwork-only role wording with a neutral analyst of public freelance marketplace profiles and preserve the five client perspectives.

- [ ] **Step 8: Run platform and AI tests to verify they pass**

Run: `npm.cmd test -- --run server/profile-collection.test.ts server/ai.test.ts`

Expected: PASS.

- [ ] **Step 9: Commit the platform propagation**

```powershell
git add server/profile-collection.ts server/profile-collection.test.ts server/ai.ts server/ai.test.ts server/index.ts server/prompt.ts
git commit -m "feat: label collected freelance platforms"
```

### Task 2: Generate local recommendations from explicit profile signals

**Files:**
- Modify: `src/scoring/profile-scoring.ts`
- Modify: `src/scoring/profile-scoring.test.ts`

**Interfaces:**
- Consumes: `ProfileInput`.
- Produces: `buildActionPlan(input: ProfileInput): Pick<ProfileAudit, 'quickWins' | 'tenMinutes' | 'oneDay' | 'maximumEffect'>`.
- Produces: recommendations that do not suggest adding a portfolio, price composition, reviews, or description when that corresponding signal is already strong.

- [ ] **Step 1: Write failing signal-specific tests**

Add to `src/scoring/profile-scoring.test.ts`:

```ts
it('asks for cases only when portfolio evidence is missing', () => {
  const withoutCases = createProfileAudit(sparseProfile, 'Профиль фрилансера');
  const withCases = createProfileAudit({
    ...sparseProfile,
    portfolio: 'Кейс: сократили ошибки на 24%; задача, решение и результат.',
  }, 'Профиль фрилансера');

  expect(withoutCases.quickWins.join(' ')).toMatch(/кейс|портфолио/i);
  expect(withCases.quickWins.join(' ')).not.toMatch(/добавить.*кейс|добавить.*портфолио/i);
});

it('does not prescribe price composition when the price already explains scope', () => {
  const audit = createProfileAudit({
    ...sparseProfile,
    price: 'от 35 000 ₽: аудит, прототип, UI-kit и два раунда правок',
  }, 'Профиль фрилансера');

  expect(audit.quickWins.join(' ')).not.toMatch(/состав цены/i);
});

it('uses marketplace-neutral one-day actions', () => {
  const audit = createProfileAudit(sparseProfile, 'FL.ru');
  expect(audit.oneDay.join(' ')).not.toMatch(/кворк/i);
});
```

- [ ] **Step 2: Run the scoring test to verify it fails**

Run: `npm.cmd test -- --run src/scoring/profile-scoring.test.ts`

Expected: FAIL because `quickWins` and `oneDay` are currently fixed arrays.

- [ ] **Step 3: Add a focused action-plan builder**

Add to `src/scoring/profile-scoring.ts` before `createProfileAudit`:

```ts
export function buildActionPlan(input: ProfileInput) {
  const hasPortfolioEvidence = /кейс|результат|итог|%|рост|сократ/i.test(input.portfolio);
  const hasPriceScope = /входит|состав|правк|этап|вариант|:/.test(input.price.toLowerCase());
  const hasReviewProof = /отзыв|оценк|5[,.]0|заказ/i.test(input.reviews.toLowerCase()) || input.completedOrders > 0;
  const hasClearDescription = input.description.trim().length >= 70;

  const quickWins = [
    !input.title.trim() && 'Сформулируйте заголовок через специализацию и результат для клиента.',
    !hasClearDescription && 'Добавьте в описание одну строку о результате и процессе работы.',
    !hasPriceScope && 'Рядом с ценой укажите состав работы, этапы и число правок.',
    !hasPortfolioEvidence && 'Вынесите выше один кейс: задача, решение и измеримый итог.',
    !hasReviewProof && 'Добавьте видимые сигналы доверия: отзывы, число заказов или результат кейса.',
  ].filter(Boolean) as string[];

  const tenMinutes = [
    !input.title.trim() && 'Перепишите первую строку через конкретную задачу и результат.',
    !hasClearDescription && 'Добавьте в описание один понятный результат для клиента.',
    !hasPriceScope && 'Уточните состав цены и границы правок.',
    'Проверьте, что первый экран профиля отвечает на вопрос «что вы сделаете».',
  ].filter(Boolean) as string[];

  const oneDay = [
    !hasPortfolioEvidence && 'Соберите два кейса в формате задача → решение → измеримый итог.',
    !hasReviewProof && 'Добавьте отзывы, число завершённых заказов или конкретный результат из кейса.',
    !hasClearDescription && 'Опишите этапы работы и следующий шаг для клиента.',
    'Обновите лучший пример работы свежими деталями и результатом.',
  ].filter(Boolean) as string[];

  const fallbackActions = [
    'Обновите лучший кейс свежим измеримым результатом.',
    'Проверьте, что цена соответствует текущему составу работы.',
  ];

  return {
    quickWins: (quickWins.length ? quickWins : fallbackActions).slice(0, 5),
    tenMinutes: (tenMinutes.length ? tenMinutes : fallbackActions).slice(0, 3),
    oneDay: (oneDay.length ? oneDay : fallbackActions).slice(0, 3),
    maximumEffect: hasPortfolioEvidence && hasPriceScope
      ? 'Свяжите лучший кейс с услугой и понятным следующим шагом для клиента.'
      : 'Свяжите специализацию, кейс и цену в одном понятном предложении.',
  };
}
```

Replace the fixed `quickWins`, `tenMinutes`, `oneDay`, and `maximumEffect` values in the returned audit with the result of `buildActionPlan(input)`. Do not return an empty action list: if all signals are strong, use preservation actions such as `Обновите лучший кейс свежим измеримым результатом.` and `Проверьте, что цена соответствует текущему составу работы.`.

- [ ] **Step 4: Run the scoring test to verify it passes**

Run: `npm.cmd test -- --run src/scoring/profile-scoring.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the signal-driven report builder**

```powershell
git add src/scoring/profile-scoring.ts src/scoring/profile-scoring.test.ts
git commit -m "feat: tailor local audit recommendations"
```

### Task 3: Make form and competitor collection neutral and transparent

**Files:**
- Modify: `src/components/ProfileForm.tsx`
- Modify: `src/components/ProfileForm.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/analyzers/kwork-analyzer.ts`
- Rename: `src/analyzers/kwork-analyzer.ts` to `src/analyzers/profile-analyzer.ts`

**Interfaces:**
- Consumes: `AnalysisRequest.profile.profileUrl` and `CompetitorInput.profileUrl`.
- Produces: a form with neutral primary-link copy, an explicit optional competitor profile URL, and manual-input fallback text.
- Produces: `ProfileAnalyzer.analyze(input)` calling `createProfileAudit(input, 'Профиль фрилансера')` for client-only fallback paths.

- [ ] **Step 1: Write failing form-copy and competitor-url tests**

Replace the existing component test with:

```tsx
it('uses a marketplace-neutral profile link label', () => {
  render(<ProfileForm onAnalyze={vi.fn()} />);
  expect(screen.getByText('Ссылка на профиль фрилансера')).toBeTruthy();
  expect(screen.getByText(/Kwork, FL.ru или Freelance.ru/i)).toBeTruthy();
});

it('offers a separate profile URL field for a competitor', () => {
  render(<ProfileForm onAnalyze={vi.fn()} />);
  expect(screen.getByRole('button', { name: /конкурентный анализ/i })).toBeTruthy();
  screen.getByRole('button', { name: /конкурентный анализ/i }).click();
  expect(screen.getByPlaceholderText('https://…')).toBeTruthy();
});
```

- [ ] **Step 2: Run the component test to verify it fails**

Run: `npm.cmd test -- --run src/components/ProfileForm.test.tsx`

Expected: FAIL because the current label says `Ссылка на Kwork-профиль` and no URL-only competitor field exists.

- [ ] **Step 3: Update the form’s actual data model and copy**

In `src/components/ProfileForm.tsx`:

```tsx
<label className="field wide">
  <span>Ссылка на профиль фрилансера</span>
  <input
    value={profile.profileUrl}
    placeholder="https://kwork.ru/... или https://fl.ru/..."
    onChange={(event) => update('profileUrl', event.target.value)}
  />
  <small>Поддерживаются публичные ссылки Kwork, FL.ru и Freelance.ru.</small>
</label>
```

Change the nearby manual button to `Дополнить данные вручную` / `Скрыть ручное заполнение`. In the competitor section, replace the overloaded `Имя или ссылка` field with a text `Имя конкурента` field and add a URL input bound to `item.profileUrl`, with placeholder `https://…`. Change the helper text to state that public links are collected when the marketplace page is available, otherwise the manually entered competitor fields are used.

Rename the analyzer class and imports to `ProfileAnalyzer`; it must call `createProfileAudit(input, 'Профиль фрилансера')`. Update both `App.tsx` client fallback usages.

- [ ] **Step 4: Run the component test to verify it passes**

Run: `npm.cmd test -- --run src/components/ProfileForm.test.tsx`

Expected: PASS.

- [ ] **Step 5: Run the relevant test group and build**

Run:

```powershell
npm.cmd test -- --run server/profile-collection.test.ts server/ai.test.ts src/scoring/profile-scoring.test.ts src/components/ProfileForm.test.tsx
npm.cmd run lint
npm.cmd run build
```

Expected: all tests pass, lint exits 0, and Vite emits `dist/`.

- [ ] **Step 6: Commit the neutral form flow**

```powershell
git add src/components/ProfileForm.tsx src/components/ProfileForm.test.tsx src/App.tsx src/analyzers/profile-analyzer.ts
git rm src/analyzers/kwork-analyzer.ts
git commit -m "feat: support neutral freelance profile intake"
```

### Task 4: Final regression and deployment handoff

**Files:**
- Modify: `README.md` only if it still calls the form a Kwork-only intake after Tasks 1–3.

**Interfaces:**
- Consumes: completed changes from Tasks 1–3.
- Produces: evidence that protected `/api/analyze` works with a public supported URL and has a local fallback when OpenAI is unavailable.

- [ ] **Step 1: Add a regression assertion for generic AI prompt wording**

Add to `server/ai.test.ts`:

```ts
it('does not use Kwork-only wording in the system prompt', () => {
  expect(SYSTEM_PROMPT).not.toMatch(/аналитик Kwork-профилей/i);
});
```

- [ ] **Step 2: Run it to verify it fails before the prompt change if not already covered**

Run: `npm.cmd test -- --run server/ai.test.ts`

Expected: FAIL until Task 1’s prompt update exists; otherwise PASS because Task 1 already performed the change.

- [ ] **Step 3: Run all automated verification**

Run:

```powershell
npm.cmd test -- --run
npm.cmd run lint
npm.cmd run build
```

Expected: all suites pass, lint exits 0, build succeeds.

- [ ] **Step 4: Manually verify the two fallback paths**

Run `npm.cmd run dev`, sign in, and verify:

1. a public FL.ru or Freelance.ru URL shows a neutral loading state and a report labelled with the detected platform when its metadata is available;
2. a malformed or blocked allowed URL with manual title/description still produces a useful basic report;
3. a competitor public URL is sent as `profileUrl` and does not break competitive analysis.

- [ ] **Step 5: Commit any README wording correction**

```powershell
git add README.md server/ai.test.ts
git commit -m "test: protect generic freelance analysis wording"
```
