# AI Analysis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a secure OpenAI-backed report layer while keeping the existing local audit available in every environment.

**Architecture:** Express owns environment loading, input limits, Responses API calls and AI JSON validation. The React app calls one local endpoint and receives a merged `ProfileAudit` plus a visible source mode; it never sees API credentials.

**Tech Stack:** Existing React/Vite/TypeScript app, Express, OpenAI Node SDK, Zod, Vitest.

## Global Constraints

- `OPENAI_API_KEY` is server-only; default model is exactly `gpt-5.6-luna`.
- One submitted profile creates at most one AI API request.
- Missing, invalid or failing AI responses fall back to deterministic local analysis.
- No payments, subscriptions, accounts, scraping or background queues.

---

### Task 1: Add server configuration and request guards

**Files:** Create `.env.example`, `.gitignore`, `server/input.ts`, `server/input.test.ts`; Modify `package.json`.

**Interfaces:** Produces `sanitizeProfile(input: unknown): ProfileInput | null`, which trims all strings and limits each one to 1,500 characters.

- [ ] Write a failing test asserting oversized description is truncated and a fully empty profile returns `null`.
- [ ] Run `npm test -- --run server/input.test.ts` and observe the missing-module failure.
- [ ] Implement field sanitation with `MAX_FIELD_LENGTH = 1500` and a profile-content check.
- [ ] Rerun the test and confirm it passes.

### Task 2: Define and validate the AI report

**Files:** Create `server/prompt.ts`, `server/schema.ts`, `server/schema.test.ts`.

**Interfaces:** Produces `aiReportSchema` and `parseAiReport(value): AiReport | null`; all required report fields and five client perspectives are validated before merging.

- [ ] Write a failing test with an incomplete response and expect `null`.
- [ ] Run it and observe the missing-module failure.
- [ ] Implement the JSON schema and parser; include only display strings/string arrays and five perspective objects.
- [ ] Rerun the test and confirm malformed reports are rejected.

### Task 3: Implement hybrid server endpoint

**Files:** Create `server/index.ts`, `server/ai.ts`; Modify `src/domain/profile.ts`, `src/scoring/profile-scoring.ts`.

**Interfaces:** Produces `POST /api/analyze` returning `{ audit: ProfileAudit, mode: 'ai' | 'basic', notice?: string }`.

- [ ] Write a failing integration-level unit test for `buildFallbackResponse` verifying `mode: 'basic'` when no key is supplied.
- [ ] Run it to verify the missing export failure.
- [ ] Implement one Responses API call with `OPENAI_MODEL ?? 'gpt-5.6-luna'`, structured JSON output, validation and catch-all fallback.
- [ ] Rerun tests and confirm fallback retains local score data.

### Task 4: Connect UI and surface mode clearly

**Files:** Create `src/api/analyze.ts`; Modify `src/App.tsx`, `src/components/Dashboard.tsx`, `src/styles.css`; Test `src/api/analyze.test.ts`.

**Interfaces:** Produces `requestAnalysis(profile): Promise<AnalysisResponse>` and a dashboard source badge.

- [ ] Write a failing test that `requestAnalysis` posts profile JSON to `/api/analyze`.
- [ ] Run the test and verify the missing import failure.
- [ ] Implement client request, AI loading copy, basic-analysis notice and response rendering.
- [ ] Rerun UI/API tests and confirm basic mode remains visible and usable.

### Task 5: Document, verify and serve

**Files:** Modify `README.md` and `package.json`.

- [ ] Document `.env` creation, API key configuration, model override and fallback behavior.
- [ ] Run `npm test -- --run`, `npm run lint`, and `npm run build`.
- [ ] Start both the server and Vite using `npm run dev`, verify a local URL and report it.

## Plan self-review

- Tasks 1–3 cover secret safety, input limits, structured AI response validation and fallback.
- Task 4 covers all required user-visible loading and fallback states.
- Task 5 covers setup, default model and verification.
