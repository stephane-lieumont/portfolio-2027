# ADR-0012 — Media processing pipeline

- **Status**: Accepted
- **Date**: 2026-08-31

## Context

The site sells 3D renders. They are the heaviest files and the only content that truly matters: degrading how they look to save kilobytes means sabotaging the product to improve a metric. The whole question is how to serve heavy images fast, not how to serve light images.

The audit of `stephane-lieumont.fr` on 2026-08-31 shows that today the exact opposite happens. The home page weighs **3.46 MB**, of which **2.88 MB is a single autoplaying MP4** (`demoreal_2022.mp4`) served from `/static/media/`: the video is **bundled into the build**, it isn't streamed, and it downloads on load whether the visitor watches it or not. The home page portrait is downloaded **twice** (`profil-stephane-lieumont.png` at 176 KB, then a `-min.png` version at 54 KB that was supposed to replace it). The six tool logos on the 3D page are PNGs **base64-encoded into the JS bundle**, so they can't be cached separately and are a third larger for the encoding. Everything else is JPG or PNG: no WebP, no AVIF, no `srcset`, no `loading="lazy"`.

Framing fares no better. Project cards crush free-ratio images into a fixed 250 px-tall box with `object-fit: cover` — a vertical render loses half its composition. The 3D carousel loads its images at `height: 120vh; min-width: 100vw`, that is, at a size larger than the viewport with no rule saying which one to download.

The new project changes the terms of the problem. Media live in **MinIO** (ADR-0003), are pushed there by presigned URL, and the database stores only an object key. The site is **prerendered at build time (SSG)** with Angular 22: at the moment the HTML is frozen, we know nothing about the browser that will read it. Angular provides `NgOptimizedImage`, which builds the `srcset`, sets `loading` and preloads the LCP — provided it's given a `loader` and each image's intrinsic dimensions. The accessibility target is **WCAG 2.2 AA**, which requires real alternative text on every media item.

Two constraints fix the rest: **MinIO does not transform images**, it serves bytes; and the API runs on Node, where `sharp` is available.

## Decision

**Derivatives are generated at upload time, in the API, with `sharp`.** When a presigned upload is confirmed, the API fetches the original from MinIO through its S3 client, reads its intrinsic dimensions and dominant colour, produces every variant, pushes them back into the bucket, and only then marks the media `ready`. A media item that isn't `ready` is never exposed publicly. The original is kept: it's the source of truth that makes full regeneration possible.

Keys are deterministic and immutable: `media/{id}/original.{ext}` for the source, `media/{id}/{width}.{format}` for the derivatives. Replacing an image creates a new identifier, never a new version under the same key. Objects are therefore served with `Cache-Control: public, max-age=31536000, immutable`.

**Two width profiles**, because not all media carry the same stakes:

- `photo` (portrait, screenshots, dev project visuals) — 320, 640, 960, 1280, 1920.
- `render` (3D) — 640, 960, 1280, 1920, 2560, 3840.

**Two modern formats at every width, AVIF and WebP**, plus **a single 1280 px JPEG** as a safety net. The `render` profile encodes AVIF at `4:4:4` and at a higher quality than `photo`: the smooth gradients of 3D renders are exactly what chroma subsampling destroys into visible banding. It's the one place where we knowingly pay in bytes.

**Format negotiation happens in nginx, not in the HTML.** The Angular `loader` emits an **extensionless** URL — `${MEDIA_PUBLIC_URL}/media/{id}/{width}` — and a `map $http_accept` on the proxy side rewrites to `.avif`, `.webp` or `.jpg`, with `Vary: Accept` on the `location /media` block. This detour is forced by `NgOptimizedImage`, which produces a single `<img>` with a single `srcset`: there's no way to express multiple formats there without giving up the directive.

**Angular consumes the pipeline through a custom `ImageLoader`** supplied via `provideImageLoader()`. The `ngSrc` is the object key, never a URL — the ADR-0003 rule holds all the way into the templates. The API returns, with each media item, its width, height, alternative text and dominant colour; the dimensions feed the `width`/`height` attributes the directive requires, and the dominant colour serves as the container background during loading. **No base64 LQIP**: the 2022 site already showed what base64 becomes inside a bundle.

Renders are no longer cropped by CSS. The container takes the media's intrinsic ratio via `aspect-ratio`, and the grid absorbs the varying heights. `object-fit: cover` remains allowed on screenshots only, where the framing isn't an authorial choice.

**The background video stays, and leaves the bundle.** Stéphane settled this on 2026-08-31: the 3D video behind the home page hero is well integrated and is kept, autoplaying, muted, looping. What was wrong was never the video — it was shipping 2.88 MB of it inside the JavaScript bundle and starting it unconditionally.

So the video moves to MinIO, served through nginx with byte-range support, and its delivery is staged:

- A **poster image** renders immediately and carries the LCP. It goes through the image pipeline above like any other media item, so it arrives as an AVIF of a few dozen kilobytes.
- The `<video>` is `preload="none"`, `muted`, `playsinline`, `loop`, `autoplay`, and fades in only once it can actually play. The poster is the first frame, so the fade never shows a jump.
- Under **`prefers-reduced-motion: reduce`, the video is never fetched.** The poster stays, still. That is a complete hero, not a degraded one.
- Under **`Save-Data`, or a `navigator.connection.effectiveType` below 4g**, likewise: poster only.
- The element is decorative — `aria-hidden`, not focusable, never carrying information the copy does not also carry.
- **A pause control ships with it**, settled with Stéphane on 2026-08-31. WCAG 2.2.2 "Pause, Stop, Hide" is **level A**, and it applies squarely: motion that starts automatically, runs past five seconds, and sits in parallel with other content must have a mechanism to stop it. `prefers-reduced-motion` does not discharge it — that is a system setting, not a mechanism on the page. The control is persistently visible, keyboard reachable, and named for its action; spec 02 carries the detail.
- **The hook stays legible over the worst frame, not the average one.** A scrim reaching at least 58% carries that guarantee; below it the ratio fails on a bright frame. See spec 06 §3.5, which also makes it an encoding constraint: the passage behind the hook has to be dark and quiet in the source, or the scrim has to be turned up so far that the video stops being visible at all.

**A hard budget applies: 1.5 MB for the loop, and it is checked before publishing.** The current file is 2.88 MB for a background that plays under text; a short, well-encoded loop lands far below that. This is a manual gate, and §Consequences says what happens when it is missed.

**The API does not transcode video.** H.264/AAC renditions are encoded upstream by Stéphane, whose job that is, and uploaded as media items. `ffmpeg` does not go into the API's Docker image for a file replaced once a year.

**One `priority` image per prerendered route** — the hero render on the home page, the main visual on a project page, the first tile of the 3D gallery. Everything else is `loading="lazy"`, with a hand-written `sizes` for each layout, because a wrong `sizes` cancels out the benefit of the `srcset`. The portrait is loaded once. The six tool logos become SVGs served with the application: they're interface elements, not content, and they have no business in MinIO or in base64.

**Alternative text is mandatory at the schema level.** In `@portfolio/shared-types`, `alt` is a `z.string().min(1)`: publishing a media item without alternative text is impossible by construction, not by discipline.

## Consequences

The home page targets **under 600 KB before the video starts**, against 3.46 MB today. The poster carries the opening image, so the page is complete and readable before a single byte of video arrives, and the video then loads outside the critical path instead of competing with it. The portrait, loaded twice for 230 KB, becomes a single AVIF of a few dozen kilobytes. The weight that remains is content, not waste.

Keeping an autoplaying background costs something, and it is worth naming: on a phone over cellular the visitor still pays for the loop, decoding it costs battery, and the effect is one a still render would largely deliver on its own. That trade was made deliberately — the video is part of what the site is, and a portfolio that opens on motion says something a static image cannot. The staged delivery is what makes the cost acceptable rather than the cost disappearing.

Generating at upload time means **the original passes through the Node process**, which contradicts the cleanest property of ADR-0003. That's accepted and contained: the transfer happens on the internal network, off the visitor path, triggered by an authenticated administrator. It has a real memory cost — decoding a 6000 px render takes several hundred megabytes — which the API container's memory limit must account for, or the first large upload kills the process.

Uploading becomes slow in the back office. A render on the full profile means twelve encodes, six of them AVIF, the most expensive format to produce: **ten to twenty seconds of waiting** on the confirmation request. That's the price of a pipeline with no queue and no worker, and it's the right trade-off for a single-user back office publishing a few projects a year. On the flip side, a crash mid-processing leaves a media item stuck in `processing`; since the original is kept, a `media:reprocess` script replays the pipeline — and it's the same script that will earn its keep the day the width grid changes, a change that will then force **regenerating everything**.

Storage grows. A render occupies about fifteen objects for roughly two and a half times the weight of its original. MinIO is on disk, so cost isn't the issue, but the bucket backup — already one of the two parts described in ADR-0003 — grows accordingly.

Format negotiation **makes correct image rendering depend on an nginx rule that doesn't live in the repository**. That's exactly the invisible point of failure flagged in the production constraints: if the `map` disappears or the order of the `location` blocks changes, images return 404s with nothing in the code to explain it. This rule must be backed up along with the nginx configuration. The accompanying `Vary: Accept` also degrades the cache hit rate if a CDN is ever put in front of `/media`.

A browser that understands neither AVIF nor WebP gets **a single 1280 px JPEG, with no `srcset`**: correct, never optimal. This compromise is deliberate and will be revisited the day those browsers drop out of the statistics — the fallback file will then leave the pipeline.

`sharp` is a native binary: it joins `better-sqlite3` and `argon2` in the `allowBuilds` list in `pnpm-workspace.yaml`, without which installation succeeds and the API won't start. It also adds a platform constraint on the production image.

Finally, video encoding remains **a manual act**. Nothing in the code guarantees that an uploaded file respects the intended bitrate: the only protection is the server-side size check. The day a badly encoded file gets through, the video will be heavy and nobody will notice before a visitor does.

## Alternatives considered

**On-the-fly transformation by a service in front of MinIO (imgproxy, thumbor)** — the most flexible: any width, at any time, with no regeneration. Rejected for three cumulative reasons: one more service to run and back up, a cache to size and purge, and above all an abuse surface — a URL that accepts transformation parameters lets anyone make the server compute ten thousand variants. Signing the URLs would fix that and make the whole thing more complex than the pipeline chosen here.

**Generating at build time, during SSG prerendering** — appealing since the site is static. Rejected because the media live in MinIO, not in the repository: the build would have to download the whole bucket, and above all **publishing a project would once again mean a redeploy**, which is precisely what ADR-0003 removed. It's the 2022 site's flaw let back in through another door.

**Manual optimisation before upload (Squoosh, Photoshop export)** — zero code. Rejected because the site's quality would then depend on the consistency of a repeated manual step, and because no change to the width grid would be possible without redoing all the work by hand. The double-loaded portrait already shows how that ends: a `-min` file made by hand, then forgotten next to the original.

**A third-party image service (Cloudinary, imgix, Cloudflare Images)** — an excellent product, but a recurring monthly cost for a personal site and an external dependency on the site's most critical content. ADR-0003 already settled in favour of self-hosting for storage; decoupling image processing from image storage would make no sense.

**Hand-written `<picture>` instead of `NgOptimizedImage`** — this is the canonical way to negotiate a format, and it would make the nginx rule unnecessary. Rejected because it forces you to rewrite in every template what the directive already does: `srcset`, `sizes`, `loading`, `fetchpriority`, LCP preloading in the `<head>`, CLS warnings in development. Pushing negotiation onto the proxy costs fifteen lines of configuration in one place.

**Client-side JavaScript detection of AVIF/WebP support** — not cleanly possible under SSG: the HTML is frozen at build time, detection lands after the first render and causes either a double request or a delayed display. Exactly what we're trying to avoid on the LCP.

**Replacing the video with a still render** — this was the original decision here, argued on weight: the video competes with the LCP, costs decoding at the busiest moment, and ignores `prefers-reduced-motion`. Overruled by Stéphane on 2026-08-31, and the objections are answered rather than dismissed: the poster carries the LCP so nothing competes with it, the video loads after first render, and `prefers-reduced-motion` and `Save-Data` both skip it entirely. What remains is a bandwidth cost on cellular, accepted knowingly.

**HLS or DASH for the demo** — adaptive streaming is the right answer for a video catalogue. For a single two-minute demo played on demand, two MP4 renditions and nginx's byte-range requests are enough, with no manifest, no segmentation and no JavaScript player to ship.

**`ffmpeg` embedded in the API to transcode video the way we transcode images** — coherent on paper. Rejected as disproportionate: a markedly heavier Docker image and a blocking transcode of several minutes, in the service of a file that changes once a year and that Stéphane already knows how to encode better than a generic preset would.

## Amendment — 2026-09-03

The static site now serves real media, and it does **not** yet follow the
pipeline above. Recording the gap rather than leaving the ADR to read as done.

**What is built.** The sixteen renders and six project covers the current site
shows are in the bucket under flat, slug-derived keys — `cgi/escart-wild.jpg`,
`projects/kasa-openclassrooms.jpg` — uploaded once by
`pnpm --filter @portfolio/api media:seed`. One format, one width, the original
JPEG. Served with the immutable cache header this ADR asks for, through
`/medias`: nginx in production, the dev server's proxy locally. The bucket
policy allows anonymous `GetObject` and nothing else; an anonymous `PUT`
returns 403.

The content model holds the object key and the intrinsic width and height, so
`<img>` reserves its box and nothing reflows on load. Alternative text is
written per image and tested to never simply repeat the title beside it.

**What is not built.** No `sharp`, no AVIF or WebP, no width variants, no
`srcset`, no `NgOptimizedImage`, no dominant colour, no `ready` state. The keys
are flat rather than `media/{id}/…`, because there is no media identifier yet —
these objects were seeded, not uploaded through the API.

**Why stop here.** Derivatives are generated _at upload time_ by the API, and
nothing uploads yet: the back office does not exist. Building the pipeline now
would mean building it against a seeding script that will be deleted, and
guessing at the profile of images that are already fixed. The cost of waiting
is measurable and bounded — the gallery ships 16 full-size JPEGs, around 5 MB
across the page, lazy-loaded below the fold.

**What this obliges.** The flat keys are interim. When the back office lands,
media move to `media/{id}/…` and the seeded objects are re-uploaded through the
API so they gain derivatives like any other. That migration is the price of
shipping images before the pipeline, and it is accepted knowingly rather than
discovered later.
