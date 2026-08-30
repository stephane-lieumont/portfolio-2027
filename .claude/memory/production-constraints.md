---
name: production-constraints
description: Production infrastructure constraints — nginx, proxied demo links, two-part backups
metadata:
  type: project
---

# Production constraints

## Demo links go through nginx

`stephane-lieumont.fr` runs behind **nginx**, which **routes the demo links to separately hosted projects**. The `demoUrl` fields are not plain external URLs: they are paths the proxy routes to other applications.

**Why it matters:** publishing a project with a `demoUrl` whose nginx route does not exist sends the visitor to an error, straight from the shop window. The code cannot detect that case — only a check on the infrastructure side can.

**How to apply it:** before publishing a project carrying a demo link, verify the route exists on the nginx side. Never reorganize the `/demo/*` paths without checking what points at them.

## The nginx configuration lives outside the repository

Path-based routing (`/api`, `/media`, `/demo`, `index.html` fallback) is described in ADR-0005, but **the actual configuration is not versioned here**.

**Why it matters:** a badly ordered set of `location` blocks can make the API disappear behind the `index.html` fallback — the API would then return HTML instead of the expected JSON, and nothing in the code would point at the cause. It is a single point of failure invisible from the repo.

**How to apply it:** when production behaves inexplicably (HTML response on an API route, missing media), suspect nginx before the code. This configuration deserves to be backed up with the same care as the database.

## Backups have two parts

The site's state lives in **two distinct places**: the SQLite file and the MinIO bucket.

**Why it matters:** restoring one without the other leaves projects pointing at missing media, or orphaned media. The two must be consistent in time.

**How to apply it:** any backup or restore procedure handles both together. Neither the SQLite file nor the media are in the Git repository.

See [[tech-stack]] for local runtime constraints.
