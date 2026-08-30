# ADR-0004 — Admin authentication: single account, cookie session

- **Status**: Accepted
- **Date**: 2026-08-30

## Context

The back office creates and edits projects and uploads media. It will be exposed on the internet, like the rest of the site, behind the existing nginx reverse proxy.

There is **exactly one user, and there will never be another**: Stéphane. No sign-up, no roles, no forgotten-password email flow, no invitations.

Nothing would be more expensive — or riskier — than bolting on a full multi-user authentication system here: more auth code means more attack surface, for zero benefit.

## Decision

A **single admin account** defined by environment variables: `ADMIN_EMAIL` and `ADMIN_PASSWORD_HASH`.

The password is hashed with **argon2** and exists in plaintext nowhere. The hash is generated offline with `pnpm --filter @portfolio/api admin:hash` and placed in the production environment.

The session is a **signed cookie, `httpOnly`, `sameSite=lax`, `secure` in production**, with a limited lifetime (`SESSION_TTL_HOURS`, 12 h by default). The signing secret comes from `SESSION_SECRET`.

`loadConfig()` **refuses to boot in production** if `ADMIN_PASSWORD_HASH` is empty or if `SESSION_SECRET` is still at its development value. Bad configuration should fail the deployment, not open the back office.

Every write route goes through the `requireAdmin` guard. Public read routes stay open.

## Consequences

The authentication surface fits in one file (`apps/api/src/plugins/auth.ts`), which makes it auditable end to end at a glance.

`httpOnly` puts the cookie out of JavaScript's reach: an XSS flaw can't steal the session. `sameSite=lax` covers the bulk of CSRF for a back office with no cross-site requests. No token is stored in `localStorage`, where any script could read it.

The trade-off: **changing the password means regenerating the hash and redeploying**. Acceptable for personal use, but it's real friction, knowingly accepted.

The session secret is global: changing it invalidates the current session — of no consequence with one user.

There is **no server-side session revocation**: a stolen cookie stays valid until it expires. That's the compromise of a stateless session; the short lifetime bounds it.

This model does not extend to multiple users. That's deliberate: if the need ever appeared, it would call for a new ADR and a real user store, not an extension of this one.

## Security — standing points of vigilance

The back office is rate-limited like the rest of the API (`@fastify/rate-limit`), which bounds brute-forcing. The login failure response never distinguishes "unknown email" from "wrong password".

`ADMIN_PASSWORD_HASH` and `SESSION_SECRET` are **never** committed: `.env` is gitignored, and `.env.example` contains only development values explicitly marked as such.

## Alternatives considered

**JWT in the Authorization header** — the usual reflex, but it forces the token to be stored client-side, and the only place JavaScript can reach it (`localStorage`) is exactly the place an XSS knows how to read. An `httpOnly` cookie is safer for a web app served from the same domain, and the JWT buys nothing here: there is no third-party API and no distributed service to prove an identity to.

**An external provider (Auth0, Clerk, Supabase Auth)** — solid, with no auth code to maintain, but it's an external dependency, one more account and a potential cost, to authenticate a single person.

**HTTP basic auth at the nginx level** — the absolute minimum, and it would work. Rejected because the API would then no longer know who is logged in, the login experience would be a browser popup, and back-office security would rest entirely on an infrastructure config living outside the repository.

**A users table in the database** — the classic structure, pointless here: a table you know will hold exactly one row, plus the management code around it, versus two environment variables.
