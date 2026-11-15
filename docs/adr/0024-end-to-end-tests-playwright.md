# ADR-0024 — End-to-end tests with Playwright, against the prerendered build

- **Status**: Accepted
- **Date**: 2026-11-15

## Context

ADR-0006 left end-to-end tests for later, « once the pages are built ». They are: two worlds, a sweep between them, a 3D viewer with its own addresses, two language trees with translated slugs, a contact form behind Turnstile, a 404 per tree. Each has unit tests in jsdom, which has no layout, no view transitions, no `<dialog>` focus handling and no real navigation between the two trees. The bugs this project has paid for (`traps.md`) all lived in that gap. Issue #45 asked for the journeys to be checked in a browser, in CI.

The site is static (ADR-0008): what ships is `apps/web/dist/web/browser`, served by nginx with `try_files $uri $uri/index.html =404` and a 404 page per tree (ADR-0005). The contact form calls `/api/contact` and Cloudflare; the pictures come from MinIO through `/medias`.

## Decision

**Playwright (`@playwright/test`, pinned), Chromium only, in a workspace package of its own, `apps/e2e`.** It has its own `tsconfig`, ESLint config (type-checked, `no-floating-promises` on: an un-awaited Playwright call is a race) and dependencies, so it adds nothing to the Angular app's typecheck, lint or coverage. `pnpm typecheck` and `pnpm lint` cover it through `pnpm -r`. It has no `test` script, so `pnpm test` and `pnpm verify` stay browser-free.

**The tests run against the build, not `ng serve`.** `apps/e2e/support/static-server.ts` serves `dist/web/browser` with nginx's rules, per-tree 404 included, so a status check means what production answers. `pnpm test:e2e` expects `pnpm build:site` to have run and says so if it has not.

**Nothing outside the build is needed.** Playwright intercepts `/medias/**` (a 1×1 PNG), Cloudflare's script (a fake `window.turnstile` with the calls the site makes) and `/api/contact` (success, 403, 502, held until the test releases it to observe the sending state). The static server answers 502 to anything else under `/api` or `/medias`, so an unmocked call fails the test.

**The tests assert what a visitor sees and does**: roles and accessible names, the URL, the document's `lang`, focus, `aria-current`/`aria-busy`. They wait for the app rather than for time: the startup loader's `data-boot` leaving, then no `data-vt` stamp and no `:active-view-transition` (during one, every click lands on the document element). No fixed sleep.

**Journeys**: the world switch both ways (also under `prefers-reduced-motion`), the language switch on a world and a project page with the scroll kept, the 3D viewer from the wall by keyboard with focus back on its tile, a project page from the wall, the contact form in both languages (validation and focus, sending, sent, captcha refused, server error), the 404 in each tree with its status, a 320px phone (header, dock, no sideways scroll), and axe on eight pages, serious and critical only.

**CI**: `.github/workflows/e2e.yml`, on pull requests and pushes to `main`, beside `verify.yml`. It builds the site, installs Chromium (cached on the lockfile), runs headless, and uploads the HTML report, traces and screenshots on failure. One retry in CI only; a test that passes on retry is reported as flaky.

## Consequences

- The journeys that unit tests cannot see — a view transition that swallows clicks, a dialog that loses focus, a slug that does not translate — fail a PR. Writing them found two things: the contact errors' decorative arrow was read aloud as part of each field's description (fixed with an empty `content` alternative), and Playwright's own click scrolls a sticky header back into its static place, which would have hidden the language switch's scroll restoration; the tests click in place instead.
- The CI run builds the site a second time (about two minutes), since `verify` does not share its build. Accepted for the independence of the two jobs.
- **Chromium only.** WebKit is worth adding once the journeys are stable: Safari is a large share of phone visitors, and the sweep, the cross-document language switch and the viewer's `<dialog>` are where engines differ. Firefox after that.
- The tests depend on the seeded content (project names, tools, slugs): a seed change can break them. They read like a visitor would, so that coupling is the point, but it is a cost.
- The static server is a reproduction of nginx, not nginx. The real image (ADR-0023, branch `feat/site-nginx`) may diverge; when it lands, running the suite against it is the better check.
- The axe pass reports nothing today, and cannot see the contrast debts listed in STATUS: those are a mote passing under text or a few bright pixels of a render, which axe does not measure.
- A dependency of about 100 MB of browser per machine, and Playwright's release cadence to follow.

## Alternatives considered

**Inside `apps/web`.** One package fewer, but its `tsconfig`, ESLint (Angular rules, layering), Vitest include patterns and coverage would all have to exclude the e2e files. A separate package keeps both configs simple.

**Against `ng serve`.** Faster to start, but it serves an index fallback on every unknown URL and no prerendered HTML: the 404 statuses, the per-tree trees and hydration would all be untested.

**`http-server` / `serve` as the static server.** Neither reproduces `try_files` with a per-tree 404 without configuration of its own; forty lines of Node with no dependency do.

**Cypress.** Runs inside the page rather than driving the browser, so full navigations between the two trees (the language switch) are awkward, and its WebKit support is experimental: no path to the next browser.

**A real MinIO and API in CI.** Closer to production, but slower, and the journeys under test are the page's, not the bucket's or the mail relay's — those have their own tests (ADR-0006, ADR-0020).
