# Mobile Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all ClientLens dashboard screens usable on phone and tablet viewports.

**Architecture:** Keep existing React components and add responsive CSS overrides at tablet and phone breakpoints. No changes to analysis, account, or API data flow are required.

**Tech Stack:** React, TypeScript, Vite, CSS, Vitest.

## Global Constraints

- Preserve existing desktop layout and colors.
- Phone breakpoint: 760 px; narrow-phone refinements: 440 px.
- Do not hide guest authentication actions.

---

### Task 1: Mobile layout rules

**Files:**
- Modify: `src/styles.css`

- [ ] Add responsive rules for the header, guest auth actions, forms, reports, account profile, action buttons, and report grids.
- [ ] Keep all cards and controls within a 320 px viewport.

### Task 2: Verify responsive build

**Files:**
- Test: `src/**/*.test.tsx`

- [ ] Run `npm.cmd test -- --run`.
- [ ] Run `npm.cmd run lint`.
- [ ] Run `npm.cmd run build`.
- [ ] Inspect the new-analysis and account screens at mobile and tablet widths.
