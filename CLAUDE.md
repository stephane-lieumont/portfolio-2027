# Portfolio 2027 — project rules

Stéphane Lieumont's portfolio: Lead Tech and 3D artist. This is his professional shop window — a visible regression or sloppy copy costs more here than an ordinary bug.

## Language

**Code, comments, commit messages and documentation are written in English.**

**The site's visitor-facing content is written in French** — every string a visitor reads, plus the project copy stored in the database. The site is French-only; see ADR and specs.

Quotes from the current site kept as audit evidence stay in French.

## Layout

```
apps/web              Angular 22 — public site and back office
apps/api              Fastify + SQLite — projects, media, contact
packages/shared-types Zod schemas + types: source of truth for the domain
docs/adr              Architecture decisions and their reasoning
docs/specs            What the site must do
.claude/memory        Durable project context
```

**Before any structural decision**, read `.claude/memory/` and `docs/adr/`. The answer is often already there, with its reasons.

## Getting started

```bash
nvm use && pnpm install && pnpm infra:up && pnpm dev
```

Node 22 is required (`.nvmrc`). The public npm registry is forced by the project's `.npmrc`.

Use `pnpm verify` to run the checks — `pnpm ci` is a built-in pnpm command that wipes `node_modules`.

## Code style

Code must be **simple and readable on first pass**. Someone opening a file should understand what it does without chasing indirections.

- **No comments**, except for a _why_ the code cannot convey: a hidden constraint, a subtle invariant, a workaround. A comment that paraphrases the code is noise that will go stale.
- Name things precisely rather than explaining after the fact.
- No premature abstraction. Three similar lines beat an early helper.
- **No `any`.** The ESLint rule is set to `error`. An `as` used to silence the compiler is a bug deferred.
- Prettier and ESLint are the authority on form. Run `pnpm format` before committing; the placement of commas is not up for debate.

## Frontend — Angular 22

Standalone, **zoneless**, signals. Full detail in the `angular-expert` agent — consult it before writing Angular code.

Non-negotiable: no `NgModule`; `OnPush` everywhere; `input()`/`output()`/`computed()` over decorators; `@if`/`@for` (with `track`) over structural directives; domain types imported from `@portfolio/shared-types` and never redeclared.

## Backend — Fastify

Node 22 runs TypeScript natively: **no build step**, and relative imports carry the `.ts` extension. `erasableSyntaxOnly` is on, so no TypeScript enums, no namespaces, no constructor parameter properties.

One plugin per responsibility (`config`, `db`, `storage`, `auth`), declared with `fastify-plugin`. Every input is validated by a Zod schema from `@portfolio/shared-types`.

## Security

The site is public and the back office will be too. These rules are not negotiable:

- **No secret in the repository or in the bundle.** Keys, hashes and tokens live in `.env`, which is gitignored. A third-party service key never ships to the client — that is why the contact email goes through the API (see ADR-0007).
- **Every input is validated** by Zod before reaching the database or storage. No client data is trusted.
- **Write routes go through `requireAdmin`.** An unguarded write route is a vulnerability, not an oversight.
- Session in a signed `httpOnly` cookie. Never a token in `localStorage`.
- Queries through Drizzle, never hand-concatenated SQL.
- Uploads: type and size enforced server-side. The bucket is publicly readable, **never publicly writable**.
- A failed login message never reveals _which_ part failed.

## Accessibility and semantics

Target: **WCAG 2.2 level AA**, enforced in CI (see ADR-0010).

HTML carries the meaning; ARIA only covers what HTML cannot express. **No editorial information is reachable by hover alone** — that is the current site's costliest defect. Every interactive state keeps AA contrast, hover and focus included. `prefers-reduced-motion` is honored everywhere.

## Responsive

**Mobile-first**, breakpoints in `min-width` only (see ADR-0011). **No feature is removed based on viewport width** — on the current site the Contact and CV buttons vanish below 1200px, which makes contact unreachable on mobile.

## Tests

**80% coverage minimum** (lines, branches, functions), enforced. Vitest on the web side, Node's built-in runner on the API side. See ADR-0006.

Test observable behavior, not implementation: a test that breaks on every refactor without any behavior changing is a test to rewrite. Clearing the bar with hollow assertions is worse than 60% honest coverage.

## Libraries

A dependency is added when it solves something genuinely tedious or riddled with accessibility traps — gallery, carousel, email delivery. Not by reflex: see ADR-0007 for the criteria. Any new structural dependency deserves an ADR.

## Decisions

A decision that is expensive to reverse or surprising to a reader → an ADR, via the `new-adr` skill. The _Consequences_ section must include the accepted downsides. An ADR that lists only benefits has not done its job.

A local, reversible choice does not deserve an ADR: the value of the collection lies in its density.

## Agents and orchestration

Four dedicated experts in `.claude/agents/`:

| Agent                  | When                                                     |
| ---------------------- | -------------------------------------------------------- |
| `angular-expert`       | frontend code, component architecture, performance, a11y |
| `design-expert`        | tokens, visual hierarchy, art direction                  |
| `communication-expert` | any visitor-facing text, copy, SEO                       |
| `motion-design-expert` | animation, transitions, `prefers-reduced-motion`         |

**Work as an orchestrator, not as a lone author.** Consult the relevant experts throughout — not once at the start — and **set them against each other when one drifts**. This is a standing instruction from Stéphane, and it exists because a specialist left alone optimizes for its own axis and quietly propagates whatever premise it was handed.

Concretely:

- **Any significant deliverable gets a contradiction pass** by an agent that did not write it, briefed to attack it. A reviewer told to "check" agrees; a reviewer told to "find what is wrong here" finds it.
- **Cross the axes deliberately.** Design proposes a hover reveal → accessibility kills it. Motion proposes a cascade → performance measures it on real renders. Copy proposes a claim → check it against `user-profile.md`, never invent.
- **Every claim traces back to a source**: the audit, an ADR, or something Stéphane said. An assertion no one can source is a drift, whoever wrote it.
- **A premise repeated is not a premise verified.** Agents inherit context and restate it with confidence. Check the foundational claims against reality — the "dark theme" premise survived three documents before a screenshot disproved it.
- **Arbitrate, do not average.** When two experts disagree, decide and record why. A compromise that satisfies both usually serves neither.

## Git and pull requests

Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`), written in English. **Stéphane is the sole author — never add a co-author trailer.** Never commit `.env`, the SQLite file, or media.

**Implementation work goes through a pull request.** Never commit a feature straight to `main`:

1. Branch from `main` (`feat/…`, `fix/…`, `refactor/…`).
2. Implement, committing as you go.
3. **Run `pnpm verify` and make it pass before opening the PR** — typecheck, lint, format, tests, 80% coverage. A red PR wastes the review.
4. Open the PR with `gh pr create`, describing what changed and why.
5. **Merge only after the checks are green.** If CI is configured, wait for it; otherwise the local `pnpm verify` is the gate.

Ask before merging, and before any push that rewrites history.

Documentation-only changes (ADRs, specs, memory) may go straight to `main`.
