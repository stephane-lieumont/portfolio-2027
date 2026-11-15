# ADR-0016 — Project videos: YouTube, embedded only after a click

- **Status**: Accepted
- **Date**: 2026-11-15

## Context

The redesigned project page (« fiche projet », approved by Stéphane on 2026-11-15) shows « Voir la vidéo » when a project has a video. Stéphane decided the same day that the video lives on YouTube and plays **on the page**, not in a new tab.

Until now the site loaded nothing from a third party: fonts are self-hosted, media come from our own bucket through `/medias`, and the prerender check now fails a page that requests anything from another origin. A standard YouTube embed breaks that on arrival: the iframe loads YouTube's player and its scripts from Google's domains, and can store data in the visitor's browser, before the visitor has shown any interest. Under the ePrivacy rules France applies through the CNIL, storage that is not strictly necessary needs consent, which the site does not collect and has no banner to collect. (Not measured here: the size of what the player loads; nothing in this decision depends on the exact figure.)

The site is prerendered (ADR-0008). Whatever is in the HTML loads for every visitor of the page.

## Decision

- **A facade, then the player.** The page renders its own poster — the project's presentation visual from the bucket — with a real `<button>` named « Lire la vidéo : <titre> ». Nothing from YouTube or Google is requested before that button is pressed: no iframe, no thumbnail from `i.ytimg.com`, no preconnect.
- **The press injects the privacy-enhanced player**, `https://www.youtube-nocookie.com/embed/<id>?autoplay=1&rel=0`, in place of the button, with a `title`, and moves focus into it so a keyboard user carries on where they were.
- **The address is validated as a YouTube video** in the `Project` schema (`videoUrl`): `https` only, `youtube.com/watch`, `/embed`, `/shorts`, `/live` or `youtu.be`, an eleven-character id. The page rebuilds the embed address from that id onto a fixed origin; it never binds the stored URL to the iframe. The parser is shared (`@portfolio/shared-types/video`) so the API's validation and the page cannot disagree.
- **A plain link to the video on YouTube** sits under the player, opening in a new tab: the way in without script, and for anyone who prefers YouTube itself.
- **If a Content Security Policy is added at nginx** (ADR-0005), it must allow `frame-src https://www.youtube-nocookie.com`. None exists today; this is recorded so the day one is written, the videos do not silently go blank.

## Consequences

The page costs nothing extra for the visitor who does not watch: no third-party request, no cookie, no extra script. The prerender check enforces it on every page, so a later change cannot slip a third-party resource into the HTML unnoticed.

Accepted downsides:

- **Two clicks to watch from the top of the page.** « Voir la vidéo » brings the visitor to the poster and focuses its play button; a second press starts the video. A single click would need the hero button to start a player further down the page, which reads as broken when the visitor is not looking there.
- **`nocookie` is not no-tracking.** YouTube's privacy-enhanced mode sets no cookie until the video plays, but once it plays, Google receives the visitor's address and can store data in the player's frame. The click is the consent we rely on; a stricter reading of the CNIL guidance would want an explicit notice beside the button. Not done now — revisit with the legal notice, which Stéphane has deferred (STATUS).
- **The poster is not the video's own frame.** It is the project's presentation visual, so the first frame of the player differs from what was pressed. Using YouTube's thumbnail would be a third-party request before the click.
- **`autoplay=1` relies on the click.** Browsers allow it because a user gesture started it; if one ever refuses, the player shows its own play button and the visitor presses twice.
- **The video host is fixed.** Vimeo or a self-hosted file would each need their own parser and facade. YouTube is what Stéphane uses; the schema refuses anything else, by design, rather than accepting a URL the page cannot play.
- **YouTube's player is outside our accessibility guarantees.** Its controls, captions and focus order are Google's. The fallback link and our own named button are what we control.

## Alternatives considered

**A standard YouTube iframe in the HTML** — one line, and the player is there on arrival. Rejected: third-party requests and storage for every visitor of the page, before any consent, on a site that has none so far; and the player's scripts competing with the images on the page's critical path.

**A link to YouTube in a new tab** — what the prototype drew, and the cheapest. Rejected by Stéphane on 2026-11-15: the video plays on the page.

**A facade library (`lite-youtube-embed` and the like)** — solves the same problem as a web component. Rejected under ADR-0007: the component is under a hundred lines here, the libraries fetch the YouTube thumbnail before the click, which is the request this decision exists to avoid, and they bring their own styles to override.

**Self-hosting the videos in MinIO** — no third party at all. Rejected for now: it needs encoding, a streaming-friendly delivery and our own player controls, for a handful of videos that already live on Stéphane's channel. ADR-0012 already keeps video transcoding out of the API.
