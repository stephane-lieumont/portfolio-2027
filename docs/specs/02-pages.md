# Spec 02 — Pages

Every page meets the cross-cutting requirements of ADR-0010 (semantics and accessibility) and ADR-0011 (responsive): a single `<h1>`, no skipped heading level, no information carried by hover alone, no horizontal overflow from 360 to 1920px.

Visitor-facing copy is written in French; this document is in English.

---

## Home — `/`

**Purpose.** Qualify the visitor within seconds and send them down the right path. This is the page that decides whether they stay.

**Contents.**

1. **The hook.** The positioning — Lead Tech / technical referent — and what Stéphane offers. Replaces the removed quotation and the "Developpeur Fullstack & Graphiste 3D" subtitle. See spec 05 for the copy.
2. **Two entry points**: "Profil dev" and "Profil 3D". Confirmed decision: two separate paths, not a unified filtered list.
3. **A 3D render as the background**, which is the page's LCP.
4. **Direct access to contact and CV**, without going through the navigation.

**What changes.** The quotation and its attribution are gone. The 2.88 MB autoplay video is replaced by a still render; the showreel, if kept, sits behind a poster and a click (ADR-0012). The decorative triangle no longer covers the heading.

**Visual hierarchy.** The hook is the first thing read. Today it comes third, after the site title and a quotation.

**Trap to avoid.** The current home page fits in `100vh` with no scrolling. On a mobile in landscape, or with enlarged text, that stance breaks. Use `dvh` and accept scrolling rather than compressing the content.

---

## Developer — `/developpeur`

**Purpose.** Convince a recruiter or a CTO. This page carries both of the site's objectives.

**Contents.**

1. **The positioning, expanded**: what the technical referent role covers in practice.
2. **Technologies**: Angular, TypeScript, RxJS/Signals, .NET/C#, Docker, CI/CD, Git, React. Flutter is no longer listed.
3. **Background**: the career change after 14 years in aerospace, reworded without the justifying stance and without relative years.
4. **Work**: the dev projects, as cards.
5. **Contact prompt** at the end.

**Project cards — requirements.** Title, technologies and year **visible at rest**, on every device. This corrects the current site's costliest defect, where that information exists only inside a `:hover` with no `@media (hover:hover)`.

Each card is a link to the project page, with a complete accessible name. The list is a `<ul>`. The grid uses `repeat(auto-fill, minmax(...))` with a fixed gutter — the current percentage gutter swings between 10 and 57px depending on width.

Images are no longer squeezed into a 250px box: the container adopts the media's intrinsic ratio (ADR-0012).

---

## Dev project detail — `/developpeur/<slug>`

**Purpose.** Prove level and judgment. These are the best-written pages on the current site: their structure is kept.

**Structure.**

1. **Context** — what the product was.
2. **Mission** — what Stéphane did precisely, and in what capacity.
3. **Concrete steps** — the actual deliverables.
4. **Technologies used.**
5. **Outbound links** — demo, source code.
6. **Next / previous project**, back to the list, contact prompt.

**What changes.** The page stops being a dead end. The demo link is served by the nginx proxy (ADR-0005): **verify the route exists before publishing**, or the visitor lands on an error straight from the shop window.

**Semantics.** The main content is an `<article>`. Steps form an ordered list. Technologies are a list, not a row of `<span>`s.

---

## 3D Graphics — `/graphisme-3d`

**Purpose.** Show a passion and **prove an ability to learn independently**. This is not a commercial page: no 3D service call to action.

**Contents.**

1. **An introductory text** — the section has none today, leaving visitors without a key to read it. It says what this practice means to Stéphane and what it brings to his work as a developer.
2. **The gallery**, as a mosaic.
3. **The tools**: Zbrush, 3ds Max, V-Ray, Substance, Photoshop, Illustrator — as SVG, no longer base64 PNG (ADR-0012).
4. **A link to ArtStation.**

**Dark theme**, following the "theme follows content" principle.

**Tiles — requirements.** Title and year **visible at rest**. Each tile has its own URL (`/graphisme-3d/<slug>`) so it can be shared and indexed. Clicking opens a lightbox that updates the URL; hitting the URL directly renders a full page.

**Lightbox — accessibility.** Focus trapped, `Escape` closes, focus returned to the originating tile, keyboard navigation between images, and an accessible name on every control.

**Reveal cascade capped**: the 16th tile must not arrive 2.4s after the first (see spec 07).

---

## Contact — `/contact`

**Purpose.** Convert. This is the target page for both of the site's objectives.

**Contents.** Form (name, email, message), location, CV link, direct email and LinkedIn links — not everyone wants to fill in a form.

**Form — requirements.**

- A `<label>` associated with every field. Floating labels do not remove the need for a real `<label>`.
- Errors **tied to their field** (`aria-describedby`), announced, and phrased so they can be acted on.
- The confirmation message is announced to assistive technology, not merely displayed.
- The submit button shows its state during submission and cannot be fired twice.
- **Sending goes through the API**, never from the browser (ADR-0007): the current site uses EmailJS client-side, which exposes the service key to anyone who opens the sources.
- **Anti-spam on the API side**: rate limiting and a honeypot field. No CAPTCHA as a first move — the current site in fact ships reCAPTCHA CSS with no active reCAPTCHA.

**Copy fix.** « Un projet, une question **où** juste un Hello World ? » → « ou ».

---

## Legal notice — `/mentions-legales`

Absent from the current site. Publisher, host, and how contact form data is handled. The form links to it.

---

## 404 page

Returns a real 404 status, explains the situation, offers the main sections. The current site redirects everything to the home page, which hides dead links instead of reporting them.
