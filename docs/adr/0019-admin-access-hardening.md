# ADR-0019 — Admin access: rotatable credentials, a second factor, server-side sessions

- **Status**: Proposed — to accept with Stéphane before the back-office work starts
- **Date**: 2026-11-15
- **Amends**: ADR-0004

## Context

ADR-0004 settled a single admin account read from environment variables (`ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`), a stateless signed cookie, and accepted two frictions: changing the password means regenerating the hash and redeploying, and a stolen cookie stays valid until it expires.

On 2026-11-15 Stéphane asked for more: the back office hidden, protected by credentials **he can change himself securely**, a way to make sure **only he** can get in, and a secure `httpOnly` cookie after login. The back office will hold every piece of content the public site shows (spec 04), so taking it over means defacing the portfolio.

## Decision

- **One admin, stored in the database**: a single row with the argon2id password hash and the TOTP secret (encrypted at rest with a key from the environment). The environment only seeds it on first boot; afterwards the database is the source of truth.
- **Two factors**: password, then a 6-digit TOTP code. Neither alone opens a session. Recovery codes are generated once and shown once.
- **Changing credentials from the back office** requires the current password and a current TOTP code, and revokes every other session.
- **Server-side sessions**: the cookie carries a random 256-bit id; the session row holds its expiry, last activity and CSRF token. Logout and credential changes delete rows.
- **Cookie**: `__Host-` prefixed, `Secure`, `HttpOnly`, `SameSite=Strict`, `Path=/`, idle timeout and absolute lifetime, a new id at every login.
- **CSRF token** on every write, besides `SameSite=Strict`.
- **Hidden path** for the admin UI and API from the environment, `noindex`, never linked.
- **Brute force**: per-IP rate limit on login, growing delays, temporary lockout, one log line per failure, a single generic error message.
- **Recovery**: a CLI command on the server resets the password or the second factor; it needs shell access to the host, which is the real root of trust.

## Consequences

- Stéphane changes his password and second factor without a deploy; a stolen cookie can be revoked.
- More auth code than ADR-0004 (TOTP, session table, CSRF, lockout): a larger surface to review and test, and a migration.
- A lost phone without recovery codes means using the server CLI — acceptable for one person, but it must be documented where he will find it.
- `SameSite=Strict` means following a link to the admin from another site lands logged out; fine for a hidden admin.
- The database now holds secrets: its backups must be treated as sensitive.

## Alternatives considered

- **Keep ADR-0004 as is**: fails the « change it myself » requirement and keeps the no-revocation gap.
- **Passkey (WebAuthn) instead of TOTP**: phishing-resistant and smoother; more code and a device dependency. Open — Stéphane chooses (spec 04 §5).
- **External identity provider**: rejected in ADR-0004 for one user; nothing changed.
- **nginx basic auth or an IP allowlist alone**: can stack on top as an extra layer, never as the only one.
