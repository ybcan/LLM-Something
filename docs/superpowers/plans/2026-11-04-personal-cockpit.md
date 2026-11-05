# Personal Cockpit Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for continuous inline execution. Steps use checkbox tracking.

**Goal:** Replace the static landing page with the user-approved functional personal cockpit.

**Architecture:** Native modules separate validated local data and timer logic from DOM rendering. A single static entry point remains compatible with the existing GitHub Pages workflow.

**Tech Stack:** HTML, CSS, browser JavaScript modules, Node's built-in test runner, Python Playwright for browser validation.

**Spec:** `docs/superpowers/specs/2026-11-04-personal-cockpit.md`

## Global Constraints

- Chinese UI; use the approved dark cockpit composition.
- No remote fonts, framework, build, cloud credentials or backend.
- Label examples, browser-only persistence and unavailable AI/ima integration honestly.
- Preserve the existing isolated checkout; no additional worktree.
- No push, deployment or unrelated workflow changes.

## Review Focus

- Malformed or unsupported backups must not replace valid local content.
- Unavailable/corrupt storage must not silently discard existing records.
- Unsafe URLs and user-entered markup must not execute.
- Completion and focus timing must remain correct across rerenders/background time.
- Filtering and narrow layouts must retain access to records and controls.

### Task 1: Local workspace and tools

**Files:** `workspace.mjs`, `tests/workspace.test.mjs`.
**Interfaces:** `createWorkspace`, `validateWorkspace`, `parseBackup`, `serializeBackup`, `loadWorkspace`, `saveWorkspace`, `removeExamples`, `safeUrl`, `textStatistics`, `formatJson`, `FocusClock`.

- [x] Write behavior tests for backup round-trip/rejection, safe storage, example preservation, safe URLs, Unicode statistics, JSON validation and elapsed-time countdown.
- [x] Run `node --test tests/*.test.mjs` and observe failure before implementing.
- [x] Implement those interfaces, then run the full Node test suite.

### Task 2: Cockpit interface

**Files:** `index.html`, `styles.css`, `app.mjs`, `tests/browser_smoke.py`.
**Consumes:** Task 1's workspace validation, persistence and timer interfaces.
**Produces:** Complete navigable cockpit with record editing, filters, tools and backup UI.

- [x] Write browser tests for local record creation/completion, persistence, filters/search, tools, backups, hostile text and mobile overflow.
- [x] Run the browser tests against the original landing page to verify the missing workflow fails.
- [x] Build the approved shell and working interactions. Use text nodes for all user content.
- [x] Run Node and browser checks, then inspect desktop and mobile screenshots against the approved composition.

### Task 3: Review and handoff

**Files:** `README.md`, this plan, execution ledger.

- [x] Document startup, tests, local-data limitations and backup recovery.
- [x] Attempt a fresh review and address confirmed material findings with regression checks. The reviewer was interrupted by a usage limit; remaining author review and this limitation are recorded in the execution ledger.
- [x] Run required checks once after final fixes and report the tested result. Leave changes available for user review; no push or publish.
