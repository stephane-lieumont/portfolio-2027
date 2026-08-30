# ADR-0006 — Testing strategy and an 80% coverage threshold

- **Status**: Accepted
- **Date**: 2026-08-30

## Context

Stéphane set an explicit requirement: **80% unit test coverage**. The portfolio is his professional showcase — a regression visible in production costs credibility, not just correctness.

The development setup is unusual: a single developer, assisted by AI agents that write part of the code. Tests play a double role here. They guard against regressions, and above all they **pin down intent**: an agent picking the code back up six months later reads the tests to learn the expected behaviour.

## Decision

**Two runners, one per application**, each native to its ecosystem rather than one shared tool that fits neither well:

- `apps/web`: **Vitest**, through Angular 22's `@angular/build:unit-test` builder. Thresholds configured in `angular.json`.
- `apps/api`: **Node's native test runner** (`node --test`), with its built-in coverage. No test dependency to install.

The threshold is **80% on lines, branches and functions**, applied globally rather than per file. Falling below it **fails the command**, and therefore CI.

Excluded from coverage are the files with no logic to verify: `main.ts`, `app.config.ts`, and the test files themselves. Counting wiring code inflates the number artificially and weakens what it measures.

`pnpm verify` at the root chains typecheck, lint, format check and tests.

## Consequences

Tests run without a browser, in jsdom on the web side: fast, so they actually get run during development instead of being endured at the end.

On the API side, no test dependency in `package.json`. The Node runner does the job, and one dependency fewer is one dependency fewer to maintain.

A global threshold rather than per file is a deliberate call: it avoids writing token tests on a trivial file just to clear a bar, while keeping the overall constraint.

The trade-off: **80% is a floor, not a goal**. A number satisfied by tests that assert nothing meaningful is worse than lower, honest coverage — it grants false confidence. The working rule is to test observable behaviour, not implementation details, so the tests survive refactoring.

Two runners mean two assertion syntaxes (`expect` on the web side, `node:assert` on the API side). That's the price of going native on each side, and it stays small.

**Booting the API fully depends on MinIO** (the `storage` plugin checks that the bucket exists at startup). Route integration tests therefore require the local infrastructure to be up. Pure unit tests don't — one more reason to keep business logic out of the plugins.

## Alternatives considered

**Karma + Jasmine** — Angular's history, and what the 2022 portfolio used. Deprecated, and it needs a real browser, which makes every run heavier.

**Jest on both applications** — one tool, one vocabulary. Rejected because Jest integrates poorly with Node 22's native TypeScript and ESM, and would require a transform layer exactly where we chose to have no build step.

**No blocking threshold, coverage as a plain indicator** — a non-blocking threshold degrades silently. Stéphane asked for 80%; CI is the only place that number stays true.

**End-to-end tests (Playwright) right now** — useful, but they'd test journeys that don't exist yet. Worth revisiting once the pages are built, in a dedicated ADR.
