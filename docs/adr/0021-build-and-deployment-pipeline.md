# ADR-0021 — Build and deployment: tag-driven GitHub Actions to the OVH VPS over SSH

- **Status**: Accepted
- **Date**: 2026-11-15

## Context

V1 must be deployed by the end of November 2026, with a git tag publishing a new version automatically (Stéphane, 2026-11-15). Production is Stéphane's OVH VPS, configured by his private repository `Infra_vps-ovh`: an nginx reverse proxy container on a Docker network `web`, Let's Encrypt certificates, and per-site folders, several of them obsolete (an old PHP portfolio, an OpenClassrooms project, an empty `sli-3d.fr` configuration for a domain retired on 2026-09-03).

ADR-0008 settled on prerendering: each page is static HTML produced at build time from the API, which makes the API a build dependency. That shapes the pipeline: the content the site is built from must be online before the site is built.

Stéphane questioned the prerendering before deciding (« je pensais que l'on faisait des fetch API ») and the cost of back-office edits (« comment forcer le rerendu ? »). He kept it once he saw what it buys — a shared project link that previews its own title and image on LinkedIn, whose crawler runs no JavaScript — and how publishing re-runs the build. He chose the CI side (« option A »), the GitHub Container Registry, and SSH as the trigger (« oui GitHub avec SSH »).

## Decision

**Prerendering stays** (ADR-0008 unchanged).

**A git tag `v*` runs one GitHub Actions workflow, in four steps, each starting only if the previous one succeeded:**

1. **Verify and package the API.** `pnpm verify`, then the API's Docker image, pushed to `ghcr.io/stephane-lieumont/…` tagged with the version.
2. **Deploy the API.** The workflow connects to the VPS over SSH as a dedicated `deploy` user. Its key is restricted in `authorized_keys` to one forced command, `deploy.sh <service> <tag>`, which pulls the image, restarts the service with `docker compose up -d` and waits for its health check. The private key lives in a GitHub environment `production`, which may require Stéphane's manual approval.
3. **Build the site against the production API.** The prerender reads the API's public, read-only GET routes over HTTPS. Both trees (FR at `/`, EN under `/en`) and the sitemap come out of this build.
4. **Package and deploy the site.** An nginx image holding the static trees, pushed to GHCR, deployed by the same forced command.

**From V1.1, the back office publishes by re-running steps 3 and 4.** A « Publier le site » button makes the API call GitHub's `workflow_dispatch` with a fine-grained token scoped to this repository's Actions only, stored in the server's `.env`. Drafts trigger nothing. One click batches every pending change. The back office shows the run's state (in progress, online, failed with a link to the log). The Actions tab's « Run workflow » stays the manual fallback.

**The infrastructure repository is cleaned to the essentials**: the reverse proxy, the certificate scripts, the Portfolio 2027 stack (site, API, SQLite volume, MinIO), a makefile and a README. The obsolete projects go, in that repository and on the server, with Stéphane.

## Consequences

- What is deployed is exactly what CI tested: the VPS compiles nothing and needs neither Node nor pnpm. Rolling back is re-running the deploy with the previous tag's images.
- Publishing is not instant: about 3 to 5 minutes between « Publier » and the change being live. This is ADR-0008's cost, now with a button and a visible state rather than a manual rebuild.
- The site build depends on the production API being up and reachable from GitHub's runners. If it is down, step 3 fails and the live site stays as it was: no half-built site ever ships. The first deployment has to bring the API up, and seed it, before the first site build.
- The API's read routes must be public. They are read-only and serve published content only. The write routes stay behind `requireAdmin` (V1.1).
- SSH must accept connections from GitHub's runners, whose addresses are not fixed. The forced command limits what a stolen key can do — deploy a published image, nothing else — but the port is exposed. fail2ban and key-only authentication remain the server's job.
- Every secret enters GitHub (amended 2026-11-16, below), and the V1.1 dispatch token will join them. Rotating them is a manual chore.
- Free with the current setup: Actions minutes are unlimited for a public repository. GHCR is free for public images; private images count against a small storage quota.

## Alternatives considered

- **Client-side fetching instead of prerendering**: instant publishing and a simpler pipeline. Rejected: link previews and per-page metadata need the HTML to carry the content (LinkedIn's crawler runs no script), every visit would wait on the API, and the showcase would go blank whenever the API is down.
- **Building on the VPS** (CI connects, `git pull`, `docker build` there): no registry needed. Rejected: the Angular build is memory-hungry on the machine serving the site, what runs is not the artefact CI tested, and a rollback means building again.
- **Watchtower polling GHCR from the VPS**: no inbound access from GitHub. Rejected: minutes of delay, a failed deployment invisible from GitHub, and rollbacks that depend on moving a `latest` tag.
- **Vercel or Netlify deploy hooks**: the same publishing model, managed. Rejected: a paid tier for this use or a non-commercial clause, a third party hosting the site, and the VPS is already paid for.

## Amendment — 2026-11-16: the secrets come from GitHub

Stéphane, 2026-11-16: « pour les variables d'environnement sensibles on utilisera les secrets de GitHub ». The server's `.env` is no longer filled by hand.

- The secrets (MinIO keys, session secret, admin email and password hash, SMTP user and password, contact address, Turnstile secret) live in the GitHub environment `production-ssh`. Before deploying the API, every run, rollbacks included, sends them over the same SSH key to the forced command, as `deploy.sh secrets` reading `KEY='value'` lines on its standard input. The script accepts exactly the expected keys, each once and non-empty, and rewrites `.env` around the two version tags. The single quotes keep Docker Compose from interpolating the `$` of an argon2 hash; a value may therefore contain neither a single quote nor a newline, which the workflow checks before sending.
- The non-secret configuration (domain, ports, bucket, SMTP host) moves into the stack's `docker-compose.yml`, versioned in the infrastructure repository.
- In V1, `deploy.sh api` also runs the content seed once the API is healthy: the content lives in the API's code (ADR-0022), so it ships with the version, and the first deployment fills the database by itself. The seed is idempotent and never deletes. It must go with the back office (V1.1), or it would overwrite what was edited there.

Consequences: changing a secret is « edit it in GitHub, then re-run the workflow with the live version », not an SSH session; nothing secret is written by hand on the server, so no copy drifts from GitHub. Accepted downsides: `production-ssh` has no required reviewer, so its secrets are only as protected as the workflows allowed to use it — the environment must be restricted to `v*` tags; a secret is readable by anyone who can push a workflow to an allowed ref; and the secrets still sit in clear in the server's `.env` (mode 660, owner `ubuntu`, group `deploy`), as they would have anyway.
