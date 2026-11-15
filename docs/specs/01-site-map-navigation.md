# Spec 01 — Site map and navigation

## Site map

```
/                                          Redirect to /developpeur (amended 2026-11-14)
/developpeur                               Developer section
/developpeur/<slug>                        Dev project detail
/graphisme-3d                              3D Graphics section
/graphisme-3d/<slug>                       3D piece detail
/contact                                   Contact
/mentions-legales                          Legal notice
/admin                                     Back office (not indexed)
/404                                        Not found
```

URLs stay in French in the French tree: they are visitor-facing and carry SEO weight. The English tree (ADR-0017) lives under `/en` with English section names: `/en/developer`, `/en/3d-art`, `/en/contact`.

### About the URLs

The current URLs are long and keyword-stuffed (`/portfolio-stephane-lieumont-developpeur`), a relic of dated SEO practice. The new ones are short and readable.

**Consequence to handle:** the old URLs are indexed and may have been shared. nginx must serve **permanent redirects (301)** from every old URL to its replacement, including the six project pages. Without that, the redesign throws away the ranking already earned. That configuration lives outside the repository (see `production-constraints`), so it must be written down and backed up deliberately.

Project `slug`s are **final**: they are the public URL. Changing one breaks links and search ranking.

## Primary navigation

Present on every page, in a single `<nav>` with an accessible name.

**Entries:** Home · Developer · 3D Graphics · Contact · **CV** (download).

Three corrections against the existing site, each driven by an observed defect:

1. **Contact and CV are in the navigation at every viewport size.** Today they disappear below 1200px without being reinstated anywhere, which makes contact unreachable on mobile from the navigation. That is the site's most serious regression.
2. **No burger menu while the space allows.** Navigation is shown in full on wide screens. It collapses only when the labels no longer fit.
3. **The collapsed menu contains every entry**, Contact and CV included.

The active entry is marked with `aria-current="page"` and a visual cue that does not rely on colour alone.

> **Superseded by the approved mockup, 2026-11-14.** Stéphane: « on doit être absolument iso avec la maquette » and « on ne garde rien de l'ancien projet ». The header carries exactly what the « Bascule » mockup carries: the role « Lead Tech & graphiste 3D » on the left, then « Contact » and the world switch (« Développement », « Graphisme 3D ») as links. There is no Home entry — `/` redirects to `/developpeur` — and no CV entry in the header: the CV is in the social dock on every page (and in the hero, PR 3). Nothing collapses at any width, so no entry needs script; below about 410px the right-hand group takes a second row because the mockup's own narrow layout leaves the role narrower than its longest word. Inside a section the switch marks its world with `aria-current="true"`, on the section page itself with `"page"`; the current entry is shown by the thumb or an underline, never by colour alone. Points 1–3 above are satisfied for Contact and the two worlds; for the CV, through the dock.

## Header

The current header is fixed and transparent with no scrolled state: on the Developer section, the black title passes over the coloured skill logos and becomes unreadable.

The new header stays reachable while scrolling but **takes an opaque background as soon as the page scrolls**, guaranteeing the contrast of its contents whatever passes underneath. It does not shrink enough to shift the layout.

> **Amended 2026-11-14 (« Bascule » shell), revised the same day.** The header is the mockup's glass, 72% of the world's ground with a blur, rather than opaque, because Stéphane approved it. The role line is set in the world's muted tone and the links at the mockup's 32–36px height, both shipped as the mockup on purpose (Stéphane: « sois iso maquette, on verra plus tard pour les contrastes »). Over a passing image the muted role falls below AA (2.35:1 worst over a light cover); the contrast and the 44px targets are deferred debt, listed with their measurements in `.claude/runtime/STATUS.md`.

A **skip link** to the main content precedes it in tab order, visible on focus.

## Social links

GitHub, LinkedIn, ArtStation. Currently in a fixed sidebar at `opacity: .2` that overlaps content on mobile — it sits on top of the "Node.js" label in the Developer section.

They stay available on every page but **never overlap content**: the sidebar rejoins the document flow when it no longer has room in the margin. Each link carries an explicit accessible name ("Stéphane Lieumont's GitHub profile"), not just an icon.

> **Amended 2026-11-14 — overlap accepted per the approved mockup.** The links live in a dock fixed at the bottom-right corner, always visible, with the contact page and the CV; content scrolls under it. `scroll-padding-block-end` keeps a focused element clear of it (WCAG 2.4.11). The accessible names follow the rule above (« Profil GitHub de Stéphane Lieumont (nouvel onglet) »).

The **ArtStation** link deserves a readable placement: it is the reference for the 3D work.

## Footer

Contents: identity, current year, legal notice link, social links, and a **contact prompt**.

> **Superseded 2026-11-14 by the approved mockup:** there is no footer. The social links and the CV are in the dock; the contact prompt belongs to each page (PR 3 onwards). The legal notice link, when `/mentions-legales` exists, needs a home — open.

The current footer reads "Designed & Developed on React ©2026" while the latest project dates from 2022. The year is rendered automatically, and the technology mention is updated — or dropped, since it tells the visitor nothing.

## Exit paths from project pages

The current detail pages are **dead ends**: no link to the live project, no source, no next project. A visitor landing from search has nowhere to go.

Every project page must offer:

- The **demo link** where one exists — served by the nginx proxy (see ADR-0005), so it must be verified before publishing.
- The **source code link** where one exists.
- Access to the **next and previous** project in the same section.
- A way back to the section list.
- A **contact prompt** at the end.

## Two deliberate interaction models

Today a dev project opens a **dedicated page** while a 3D tile opens a **lightbox** — two behaviours for the same action, with no prior cue.

The distinction is kept, because the content justifies it: a dev project has a story to tell (context, mission, deliverables), a 3D image is looked at. But it must be **made legible**: 3D tiles signal visually that they enlarge an image, dev cards that they lead to a page.

Every 3D piece nonetheless gets **its own URL** (`/graphisme-3d/<slug>`), so it can be shared and indexed. The lightbox updates the URL on open; hitting the URL directly renders a full page.

The lightbox meets the accessibility requirements: focus trapped, `Escape` closes, focus returned to the originating tile, keyboard navigation between images.

## 404 page

The current site redirects everything to the home page. A **real 404** is required: correct status code, an explanation, and links to the main sections.

> **Interim, 2026-11-14.** The Travolta page is gone with the rest of the old site. Until a designed 404 lands, it is a mono eyebrow « Erreur 404 », a heading and one link back to `/developpeur`; the header carries the other sections. Still `noindex`, still emitted as `404/index.html`.

## Robots and indexing

`/admin` is excluded from indexing and from prerendering. It keeps itself out of the index with `noindex`, **never with a `Disallow` line in `robots.txt`**: robots.txt is public, and a line naming the back office publishes its address (ADR-0019).

A `sitemap.xml` is generated at build time from the prerendered pages of both trees (every page that names a canonical and is not `noindex`: the 404 and the root redirects are out), each entry with its `hreflang` alternates. `robots.txt` allows everything and references it. Both live at the site's root only, never under `/en`.

Every indexable page carries, in its prerendered HTML: a self-referencing canonical in its own tree (the same address as its `hreflang` entry for that tree), Open Graph (`og:locale` `fr_FR` / `en_GB`, the share card of its world and language, 1200 × 630) with a `summary_large_image` Twitter card, and JSON-LD (`Person` and `WebSite` on the world pages, a `WebPage` elsewhere) built only from what the site already shows. The 404 carries none of them.
