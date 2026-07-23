# FreelanceTrust SaaS Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing Kwork audit MVP into a dark, responsive SaaS product with saved reports, three analysis modes and selectable OpenAI analysis levels.

**Architecture:** Preserve the existing scoring and secure API endpoint. Add typed analysis modes, report storage and demo data as independent modules; App becomes a dashboard shell that routes views through state, while focused components render forms, reports, history and settings.

**Tech Stack:** React, TypeScript, Vite, Express, OpenAI SDK, Zod, localStorage, Vitest.

## Global Constraints

- Keep API keys server-side and default `OPENAI_MODEL` to `gpt-5.6-luna`.
- Allow only `gpt-5.6-luna`, `gpt-5.6-terra`, `gpt-5.6-sol` as user-selected analysis levels.
- All modes must work without an API key using local reports and demo data.
- No billing, accounts, paid features, scraping or guarantee claims.
- Preserve the existing Kwork analyzer and fallback scoring boundary.

---

### Task 1: Extend domain models and analysis modes

**Files:** Modify `src/domain/profile.ts`, `server/input.ts`, `server/ai.ts`, `server/prompt.ts`; Create `src/domain/report.ts`; Test `src/domain/report.test.ts`.

**Interfaces:** `AnalysisMode = 'quick' | 'deep' | 'competitive'`; `AiModel = 'gpt-5.6-luna' | 'gpt-5.6-terra' | 'gpt-5.6-sol'`; `AnalysisRequest` includes profile, mode, model and competitors.

- [ ] Write tests that reject an unknown model and provide mode defaults.
- [ ] Verify red with missing domain exports.
- [ ] Add types, server sanitation and model allowlist; set mode-specific report detail.
- [ ] Verify green.

### Task 2: Add report persistence and demo data

**Files:** Create `src/data/demo-report.ts`, `src/storage/report-store.ts`, `src/storage/report-store.test.ts`.

**Interfaces:** `saveReport(report)`, `listReports()`, `getReport(id)`, `deleteReport(id)`, `createDemoReport()`.

- [ ] Write test that saved report survives a new store read and can be deleted.
- [ ] Verify red.
- [ ] Implement versioned localStorage record validation and demo fixture.
- [ ] Verify green.

### Task 3: Upgrade analysis endpoint and UI API layer

**Files:** Modify `server/index.ts`, `server/ai.ts`, `server/schema.ts`, `src/api/analyze.ts`; Test `server/ai.test.ts`, `src/api/analyze.test.ts`.

**Interfaces:** `POST /api/analyze` accepts `{ profile, mode, model, competitors }` and returns a mode-aware `AnalysisResponse`.

- [ ] Add a failing test for invalid model fallback to Luna and missing-key basic response.
- [ ] Verify red.
- [ ] Add bounded competitor sanitation, mode/model prompt context and one-request guard.
- [ ] Verify green.

### Task 4: Build dashboard shell and new visual system

**Files:** Create `src/components/AppShell.tsx`, `src/components/Sidebar.tsx`, `src/components/StatusBadge.tsx`; Modify `src/App.tsx`, `src/styles.css`.

**Interfaces:** `AppView = 'new' | 'reports' | 'demo' | 'history' | 'profile' | 'settings'`; shell takes active view and navigation callback.

- [ ] Write a failing component test for navigating from New analysis to History.
- [ ] Verify red.
- [ ] Implement dark violet shell, responsive nav, active sections, API state and onboarding card.
- [ ] Verify green at desktop and mobile breakpoints.

### Task 5: Add analysis form modes and competitor flow

**Files:** Modify `src/components/ProfileForm.tsx`; Create `src/components/ModeSelector.tsx`, `src/components/CompetitorForm.tsx`; Test `src/components/ModeSelector.test.tsx`.

**Interfaces:** Form returns `AnalysisRequest`; competitive form accepts 1–3 `CompetitorInput` records.

- [ ] Write failing test selecting Competitive reveals competitor inputs.
- [ ] Verify red.
- [ ] Implement segmented mode control, model selector, examples, validation, deep/quick descriptions and competitor entry.
- [ ] Verify green.

### Task 6: Build report dashboard and categories

**Files:** Create `src/components/CategoryMap.tsx`, `src/components/TrustMap.tsx`, `src/components/CompetitiveComparison.tsx`; Modify `src/components/Dashboard.tsx`, `src/scoring/profile-scoring.ts`.

**Interfaces:** `CategoryAudit[]` has score, status, explanation, recommendation and example. Competitive report has comparison rows and differentiation actions.

- [ ] Write failing scorer test asserting all 12 named categories have scores between 0 and 100.
- [ ] Verify red.
- [ ] Add category report builder, quick/deep presentation density, trust map, rich report blocks and competitive comparison fallback.
- [ ] Verify green.

### Task 7: Implement reports, demo, profile and settings views

**Files:** Create `src/components/ReportsView.tsx`, `src/components/EmptyReports.tsx`, `src/components/SettingsView.tsx`, `src/components/ProfileView.tsx`; Modify `src/App.tsx`.

- [ ] Write failing test opening a stored report from the report list.
- [ ] Verify red.
- [ ] Implement report cards, open/delete/re-run, demo flow, empty state, local profile preferences and model settings.
- [ ] Verify green.

### Task 8: Update docs and verify release scenarios

**Files:** Modify `README.md`, `.env.example`.

- [ ] Document the three model levels and the default Luna configuration.
- [ ] Run tests, lint and production build.
- [ ] Verify manually: no-key fallback, configured-key route, sparse input, demo, quick/deep/competitive, stored report and mobile view.
- [ ] Start `npm run dev` on `127.0.0.1:5173`.

## Plan self-review

- Covers design, personal workspace, three analysis modes, model selector, AI/fallback, all report categories and required validation states.
- Limits AI calls to one per submit and preserves local functionality.
- Maps report data consistently from `AnalysisRequest` through API, storage and dashboard views.
