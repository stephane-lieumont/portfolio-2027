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

**The video leaves the bundle and leaves autoplay behind.** The home page hero becomes a still render, which is the page's LCP. The demo becomes an on-demand element: a poster image — an ordinary image media item, so it goes through the pipeline above — with an explicit play button over it; the `<video>` tag is `preload="none"` and its source is attached only on click. The file is served from MinIO through nginx, which handles byte-range requests. **The API does not transcode video**: two H.264/AAC renders at 720p and 1080p are encoded upstream by Stéphane, whose job that is, and uploaded as two media items. `ffmpeg` does not go into the API's Docker image for a file replaced once a year.

**One `priority` image per prerendered route** — the hero render on the home page, the main visual on a project page, the first tile of the 3D gallery. Everything else is `loading="lazy"`, with a hand-written `sizes` for each layout, because a wrong `sizes` cancels out the benefit of the `srcset`. The portrait is loaded once. The six tool logos become SVGs served with the application: they're interface elements, not content, and they have no business in MinIO or in base64.

**Alternative text is mandatory at the schema level.** In `@portfolio/shared-types`, `alt` is a `z.string().min(1)`: publishing a media item without alternative text is impossible by construction, not by discipline.

## Consequences

The home page targets under 600 KB on first render against 3.46 MB today, and most of that budget goes into the hero render — that is, into what the visitor came to see. The 2.88 MB of video becomes zero bytes until someone clicks. The portrait, loaded twice for 230 KB, becomes a single AVIF of a few dozen kilobytes. The weight that remains is content, not waste.

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

**Keeping autoplay with a lighter video** — even at 800 KB, a video that starts on its own competes directly with the LCP for bandwidth, forces decoding at the busiest moment, and ignores `prefers-reduced-motion`. The staging effect isn't worth that price; a full-width still render produces the same opening impact anyway, which is one thing the current design got right.

**HLS or DASH for the demo** — adaptive streaming is the right answer for a video catalogue. For a single two-minute demo played on demand, two MP4 renditions and nginx's byte-range requests are enough, with no manifest, no segmentation and no JavaScript player to ship.

**`ffmpeg` embedded in the API to transcode video the way we transcode images** — coherent on paper. Rejected as disproportionate: a markedly heavier Docker image and a blocking transcode of several minutes, in the service of a file that changes once a year and that Stéphane already knows how to encode better than a generic preset would.
