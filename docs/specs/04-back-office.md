# Spec 04 — Back office (draft)

Drafted on 2026-11-15 from Stéphane's brief. **Status: draft, to settle with him before the work starts.** It starts after the client-references PR is merged and the responsive audit is done (Stéphane, 2026-11-15). The interactive CV is out of scope: it is a V2.

> « Il faudrait servir les projets avec description détaillée dev et graphisme, les technos dev et graphisme. Pense à des modèles de données qui permettront d'administrer ça dans un back office dédié au site. Il faudra une communication front, back, MinIO. Le back office sera caché et protégé par des identifiants que je pourrais modifier de manière sécurisée. Il faudra trouver une solution pour faire en sorte que ce ne soit que moi qui ai accès à ce back office. Secure cookie httpOnly obligatoire après connexion. »

## 1. What the back office manages

| Domain                                                          | Entity (spec 03)        | Today                                                                     |
| --------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------- |
| Dev work, client references included                            | `Project`               | `core/data/static-content/static-content.ts`                              |
| 3D work                                                         | `Artwork` (+ its views) | same file                                                                 |
| Dev and 3D tools, their marks and « Maîtrise » points           | `Tool` (new, below)     | `shared-types/registries.ts` + `core/data/world-content/world-content.ts` |
| Media (renders, presentation visuals, client logos, tool marks) | `MediaAsset`            | MinIO bucket + `public/`                                                  |

World pages (hero, facts, lede) and the contact page stay in the static content for this first version: they change rarely and their shape is tied to the design. Moving them is a later step.

Every visitor-facing text is `{ fr, en }` and both languages are required to publish (ADR-0017). Drafts may be incomplete; **publishing validates the full schema**.

## 2. Data model additions to spec 03

**`Tool`** replaces the hard-coded registries, so a new technology is a record, not a code change:

| Field        | Type                                     | Notes                                                                      |
| ------------ | ---------------------------------------- | -------------------------------------------------------------------------- |
| `id`         | uuid                                     |                                                                            |
| `slug`       | kebab-case                               | Stable key used by projects, unique.                                       |
| `world`      | `'dev' \| 'cgi'`                         | Two vocabularies that never mix (spec 03).                                 |
| `label`      | localized                                | « Tests unitaires » / « Unit tests »; most are proper names, same in both. |
| `markAsset`  | asset id?                                | Monochrome SVG mark; empty → monogram fallback.                            |
| `inStack`    | boolean                                  | Shown in the world page's Stack section.                                   |
| `stackOrder` | integer                                  | Order in the Stack section.                                                |
| `mastery`    | `{ lead: localized; text: localized }[]` | 2–6 points, only when `inStack`.                                           |

**`Project`** gains what the client references introduced (`logo`, `logoTint`, `startedAt`, `releasedAt` nullable for ongoing work, `googlePlayUrl`, optional presentation visual) — already in spec 03 with the references PR.

**`MediaAsset`** keeps its table; it gains `purpose` (`render`, `presentation`, `logo`, `mark`, `cover`) so the media library can filter, and `focal` for renders (ADR-0015).

**Ordering** stays derived (spec 03: newest first), no manual sort.

## 3. Front ↔ back ↔ MinIO

- **Reads (public)**: `GET /api/projects`, `/api/artworks`, `/api/tools`, published only, Zod-validated on the way out. Images keep coming from the bucket through nginx `/medias` (ADR-0003, ADR-0012).
- **The public site stays prerendered** (ADR-0008): the build reads the API instead of the static file, and **publishing triggers a rebuild** (a CI job or a deploy hook). No Node process serves the public site. To decide: rebuild trigger and its delay (minutes) versus a preview mode.
- **Writes (admin)**: `POST/PATCH/DELETE /api/admin/...`, all behind `requireAdmin`, each body validated by the shared Zod schema.
- **Uploads**: the browser sends the file to the API, which checks type and size **server-side**, writes it to MinIO, derives the WebP variants (existing `media:derive` logic) and records the `MediaAsset`. The bucket stays publicly readable and never publicly writable. No presigned PUT for now: one path, fully validated.
- **The admin UI** is a separate lazy Angular area (`features/admin/`) excluded from prerendering and from the public bundle, so no admin code ships to visitors.

## 4. Access: only Stéphane

Today (ADR-0004): one account from env vars, password hash changed by redeploying, stateless signed cookie. Stéphane now wants to **change his credentials himself, securely, from the back office**, and to be sure he is the only one who can get in. Proposed in ADR-0019 (to accept before coding):

1. **Hidden entry**: the admin lives at an unguessable path set in the environment, not linked anywhere, `noindex`, `X-Robots-Tag`, absent from the sitemap. Obscurity is a bonus layer, never the protection.
2. **Password + second factor (TOTP)**: argon2id password plus a 6-digit code from an authenticator app. A leaked password alone opens nothing. (Alternative to weigh: a passkey/WebAuthn, phishing-resistant, no code to type.)
3. **Credentials stored hashed in the database** (one admin row), changed from the back office: current password + current TOTP code required; changing them **revokes every other session**. A one-off CLI command recovers access if the second factor is lost.
4. **Server-side sessions**: the cookie holds a random session id; the session lives in a table, so logout and password change revoke it for real (ADR-0004's « no revocation » goes away).
5. **The cookie, mandatory after login**: `__Host-` prefix, `Secure`, `HttpOnly`, `SameSite=Strict`, `Path=/`, short idle timeout plus an absolute lifetime; rotated at login.
6. **CSRF**: `SameSite=Strict` plus a per-session CSRF token checked on every write.
7. **Brute force**: rate limit per IP on login, exponential delay after failures, temporary lockout, a log line per failure; the error never says which factor failed.
8. Optional, if Stéphane wants it: an IP allowlist or a VPN in front of the admin path at nginx.

## 5. Open questions for Stéphane

1. Second factor: TOTP (authenticator app) or passkey?
2. Rebuild on publish: acceptable to wait a few minutes before a change is live?
3. Move the world pages and contact copy to the back office now, or later?
4. Where does production run (the same server as today, Docker), and which CI deploys?
