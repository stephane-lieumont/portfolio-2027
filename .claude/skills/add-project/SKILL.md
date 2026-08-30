---
name: add-project
description: Add a project to the portfolio end to end — write the copy, upload the visuals to MinIO, create it through the API, verify how it renders. Use when Stéphane wants to publish a new dev or 3D piece of work, or update an existing project.
---

# Adding a project to the portfolio

A project is made of **copy** (written), **media** (uploaded to MinIO) and a **database entry** (created through the API). All three must be consistent before publishing.

## Before starting

Check that the environment is running:

```bash
pnpm infra:up && pnpm dev:api
```

The data model is authoritative in `packages/shared-types/src/project.ts`. If a field is missing to describe the project, **do not improvise it inside an existing string**: change the shared schema, then the Drizzle schema (`apps/api/src/db/schema.ts`), generate the migration (`pnpm --filter @portfolio/api db:generate`) and note it down. A field bent out of its purpose is debt you pay on the next project.

## Steps

**1. The copy.** Delegate writing to the `communication-expert` agent — the site is French-speaking, so the copy it produces is in French. It needs: the project context, Stéphane's exact role, the concrete steps, the technologies, the dates. Never fill a gap with an assumption — ask.

**2. The media.** Every project has a cover image and, often, a gallery. The upload flow goes through a presigned URL: the API issues a ticket (`POST /media/upload-ticket`), the file goes straight to MinIO, then the upload is confirmed (`POST /media/confirm`). Set a real `alt` on every media item — it is an accessibility requirement and the template lint checks it on the web side.

For 3D renders, watch the file size: they are the heaviest files on the site and the main threat to performance.

**3. The creation.** Call the API with `POST /projects` and a payload matching `createProjectInputSchema`. The `slug` is kebab-case and final: it becomes the public URL, so changing it breaks existing links and search ranking.

Status `draft` first. It moves to `published` after review, not before.

**4. The verification.** Render the project in the app (`pnpm dev:web`) and check: images load, text does not overflow, the demo link responds.

## The case of demo links

`demoUrl` points at separately hosted projects, **proxied by the nginx reverse proxy** (see ADR-0005). A demo link is not a plain external URL: verify that the matching nginx route actually exists before publishing, otherwise the visitor lands on an error straight from the shop window.
