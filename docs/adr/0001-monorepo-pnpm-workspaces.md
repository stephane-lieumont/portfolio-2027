# ADR-0001 — Monorepo with pnpm workspaces

- **Status**: Accepted
- **Date**: 2026-08-30

## Context

Portfolio 2027 brings together three pieces: an Angular application, a Node API, and the data model they share. The 2022 portfolio was front-end only, with its data hard-coded in TypeScript files — front/back consistency simply wasn't a question.

It is now. A project is described once and consumed from both sides; if the two definitions drift apart, the bug shows up at runtime, in production, on Stéphane's professional showcase.

The project is built by one person assisted by AI agents, on personal time. The tooling has to stay understandable without external documentation.

## Decision

A single monorepo managed by **pnpm workspaces**, with no extra orchestration layer:

```
apps/web              Angular
apps/api              Fastify
packages/shared-types Zod schemas + types, source of truth for the domain
```

Both applications consume the shared package through the `workspace:*` protocol. Angular resolves it with a `paths` alias pointing straight at the TypeScript sources: no intermediate build step for the shared package.

## Consequences

The data model is defined in exactly one place. A contract change breaks the typecheck on both sides immediately, instead of slipping through unnoticed until runtime — that's the main benefit, and on its own it justifies the monorepo.

One `pnpm install`, one lockfile, one TypeScript version for the whole repo.

The trade-off: the root carries configuration that neither `apps/web` nor `apps/api` would carry alone, and anyone discovering the repo has to understand workspaces before running anything. With no task cache, `pnpm -r build` rebuilds everything every time — fine at three packages, worth revisiting if the repo grows.

Changing a shared type hits both applications at once: that's the point, but it also means you can't deploy a front end and a back end out of sync without noticing.

## Alternatives considered

**Nx** — the code generation and task caching are real, but they pay for themselves on a ten-package repo, not a three-package one. On a solo project, `nx.json` and the `project.json` files add a layer of indirection that neither Stéphane nor an AI agent needs to decode to understand how the project builds.

**Two separate repositories** — this is exactly the scenario where the data model drifts. It would have meant publishing the shared package to a registry, or living with two definitions kept in sync by hand. The cost of that duplication far exceeds the cost of the monorepo.

**A single package with front and back mixed together** — less configuration, but the two have incompatible build targets, tsconfigs and lifecycles. Separating them costs almost nothing here.
