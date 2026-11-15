# Spec 04 — Back office (draft)

Drafted on 2026-11-15 from Stéphane's brief. **Status: draft, to settle with him before the work starts.** It starts after the client-references PR is merged and the responsive audit is done (Stéphane, 2026-11-15). The interactive CV is out of scope: it is a V2.

> « Il faudrait servir les projets avec description détaillée dev et graphisme, les technos dev et graphisme. Pense à des modèles de données qui permettront d'administrer ça dans un back office dédié au site. Il faudra une communication front, back, MinIO. Le back office sera caché et protégé par des identifiants que je pourrais modifier de manière sécurisée. Il faudra trouver une solution pour faire en sorte que ce ne soit que moi qui ai accès à ce back office. Secure cookie httpOnly obligatoire après connexion. »

## 1. What the back office manages

**The guiding rule** (Stéphane, 2026-11-15): « l'idée est de pouvoir éditer les champs qui sont amenés à évoluer avec le temps ». Editable is the content that changes with his career: the works, the tools, the Stack, the world pages' highlighted technologies, his current position, the facts and ledes, the CV file and the social links. Not editable: the design's structure and the interface strings (navigation, form labels, error messages, accessibility texts), which stay in the code and in the xlf files.

| Domain                                                          | Entity                  | Today                                                                         |
| --------------------------------------------------------------- | ----------------------- | ----------------------------------------------------------------------------- |
| Dev work, client references included                            | `Project`               | `apps/api/src/db/seed/content.ts`, served read-only (ADR-0022)                |
| 3D work                                                         | `Artwork` (+ its views) | same file                                                                     |
| Dev and 3D tools and their icons                                | `Tool` (below)          | `tools` table, seeded from `seed/tools.ts`, `GET /api/tools`                  |
| The world pages' Stack section and its « Maîtrise » points      | `StackEntry` (below)    | `stack` table, seeded from `seed/stack.ts`, `GET /api/stack`                  |
| Media (renders, presentation visuals, client logos, tool marks) | `MediaAsset`            | `media_assets` table, seeded from `seed/media.ts`; files in MinIO + `public/` |

**The world pages' top content** is editable too, as plain fields with the structure kept as it is: « dans le back office il faudra aussi éditer les technos en haut de la page, si je change de stack prio, le sous-titre du poste occupé et les éléments de description ; on conserve la structure, ce ne sera que des champs modifiables ». That is the highlighted technologies (« Angular · .NET · TypeScript », tool references, reordered when his priority stack changes), the subtitle carrying his current position, and the description elements (the facts list and the lede). Their data stays in `core/data/world-content/world-content.ts` for V1 and moves to the API with the back office (#54). The contact page stays static for this first version.

Every visitor-facing text is `{ fr, en }` and both languages are required to publish (ADR-0017). Drafts may be incomplete; **publishing validates the full schema**.

## 2. Data model additions to spec 03

Settled with Stéphane on 2026-11-15 and built in V1 (ADR-0022): the tools, the Stack and the media are tables the API reads; the V1.1 back office writes them.

**`Tool`** (`tools`) replaces the hard-coded registries, so a new technology is a record, not a code change:

| Field   | Type       | Notes                                                                                  |
| ------- | ---------- | -------------------------------------------------------------------------------------- |
| `id`    | uuid       | What works and Stack entries reference.                                                |
| `slug`  | kebab-case | Unique. A readable key (the world pages' eyebrow, the CSS), never what a work stores.  |
| `label` | localized  | « Tests unitaires » / « Unit tests »; most are proper names, the same in both.         |
| `icon`  | asset id?  | A `mark` media asset, a monochrome SVG or PNG drawn as a mask; empty → the name alone. |

A tool has no world: the same tool may be credited by a dev project and a 3D piece, and may sit in both Stack sections.

**`StackEntry`** (`stack`): one row per tool shown in a world's Stack section.

| Field      | Type                                                 | Notes                                                                                       |
| ---------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `id`       | uuid                                                 |                                                                                             |
| `tool`     | tool id                                              | Foreign key, `ON DELETE RESTRICT`. **Unique with `domain`**: one entry per tool per domain. |
| `domain`   | `'dev' \| 'cgi'`                                     | The world whose page shows it.                                                              |
| `position` | integer                                              | Its order in that section, ascending.                                                       |
| `points`   | `{ strongLine: localized; secondLine: localized }[]` | 2–6, ordered, a JSON array on the row validated by `stackEntryRecordSchema`.                |

The mockup's grouped names in the Stack (« RxJS / Signals », « .NET / C# ») are not in the model: the front end keeps them as labels (`tool-marks.ts`), as before. To settle: a per-entry name if Stéphane wants to edit them.

**Works reference tools by id.** `Project.technologies` and `Artwork.software` store tool ids inside the work's JSON document, so renaming a slug never breaks a reference; the API answers with each tool resolved (`id`, `slug`, `label`, `icon`). **Deleting a tool still in use is refused**: the Stack's foreign key restricts it in SQLite, and `deleteTool` (`apps/api/src/db/tool-usage/`) checks the works' documents, which no constraint sees, and returns where the tool is used (`toolUsage`) so the back office can say so.

**`Project`** gains what the client references introduced (`logo`, `logoTint`, `startedAt`, `releasedAt` nullable for ongoing work, `googlePlayUrl`, optional presentation visual) — already in spec 03 with the references PR.

**`MediaAsset`** (`media_assets`): `purpose` (`render`, `cover`, `presentation`, `logo`, `mark`) so the media library can filter; `storage` (`bucket` for MinIO, `site` for the web app's `public/`) and `key` (a bucket object key, or a root-relative path); `contentType`, intrinsic `width` and `height` (an SVG's viewBox may be fractional), localized `alt` (blank in both for a decorative mark), `averageColor`, a raster logo's WebP `variants`, and `byteSize`, known once the API receives the file (V1.1 upload, #55). Works name their images by asset id and the API resolves them into the shapes the site renders. Still to add with the back office: `focal` for renders (ADR-0015, in the `Artwork` document for now) and an owner reference (spec 03 « Media ownership »), which the shared marks contradict: React and React Native show one file.

**Ordering** stays derived (spec 03: newest first), no manual sort.

## 3. Front ↔ back ↔ MinIO

- **Reads (public)**: `GET /api/projects`, `/api/artworks`, `/api/tools`, `/api/stack?domain=dev|cgi`, works published only, every reference resolved and Zod-validated on the way out. Images keep coming from the bucket through nginx `/medias` (ADR-0003, ADR-0012).
- **The public site stays prerendered** (ADR-0008): the build reads the API (done in V1, ADR-0022), and **publishing triggers a rebuild** (a CI job or a deploy hook). No Node process serves the public site. To decide: rebuild trigger and its delay (minutes) versus a preview mode.
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
3. ~~Move the world pages to the back office?~~ Their top content, yes, as plain fields (§1, #54); the contact copy later.
4. Where does production run (the same server as today, Docker), and which CI deploys?
