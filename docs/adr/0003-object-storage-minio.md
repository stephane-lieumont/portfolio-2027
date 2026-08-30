# ADR-0003 — Media stored in MinIO, presigned uploads

- **Status**: Accepted
- **Date**: 2026-08-30

## Context

The portfolio shows 3D renders and project screenshots: they are the heaviest files on the site and its most important content, since what's being sold is Stéphane's work.

In 2022, images were imported straight into the React bundle. Adding a project required a commit and a redeploy, and every image made the build heavier. The new back office has to allow adding a project without touching code.

Storing the binaries in SQLite would be technically possible and practically bad: the database would balloon, backups would get heavy, and the API would serve bytes that a file server serves better.

## Decision

**MinIO** (S3-compatible) for all media, in a container alongside the API.

Uploads go through **presigned URLs**: the API issues a ticket, the browser pushes the file straight to MinIO, then confirms the upload to the API, which records the metadata. **The file never passes through the Node process.**

The database stores only an **object key**, never an absolute URL. The public URL is rebuilt on read from `MEDIA_PUBLIC_URL`.

## Consequences

The API doesn't proxy files: no memory eaten by multi-megabyte renders, no timeouts on large uploads. That's the main win.

Storing the key rather than the URL makes the media origin movable — putting MinIO behind another domain or a CDN takes one environment variable change, with no data migration. An absolute URL in the database would have frozen that decision forever.

S3-compatible: if the hosting changes one day, the code stays and only the configuration moves.

The trade-off: one more service to run and back up, and the site backup becomes a two-part job — the SQLite file **and** the bucket. The two must stay consistent; a partial restore leaves projects pointing at missing media.

Presigned URLs are short-lived and the client has to handle their expiry. The two-step upload flow is more complex than a plain multipart POST, and a ticket issued then abandoned leaves an orphan row in the database: periodic cleanup will be needed.

The bucket must be publicly readable for published media, but **never publicly writable**. That distinction is the only thing standing between the site's storage and anyone who feels like dropping files into it.

## Alternatives considered

**Local filesystem served by nginx** — simpler, with no extra service. Rejected because the media would be tied to the machine: no separation between storage and compute, and a hosting migration would turn into moving files by hand.

**A managed S3 service (AWS, Scaleway, Cloudflare R2)** — zero administration, but a monthly cost and an external dependency for a personal project. MinIO keeps the door open: since the code is S3-compatible, switching remains possible without a rewrite.

**Multipart upload through the API** — simpler to implement, but Node then carries the full weight of the files, with the size limits and timeouts that come with it. A bad trade for 3D renders.

**Images in the Git repository** — the current setup. The repository grows without bound, and publishing a project stays a developer act when the whole point is to stop it being one.
