# Spec 01 — Site map and navigation

## Site map

```
/                                          Home
/developpeur                               Developer section
/developpeur/<slug>                        Dev project detail
/graphisme-3d                              3D Graphics section
/graphisme-3d/<slug>                       3D piece detail
/contact                                   Contact
/mentions-legales                          Legal notice
/admin                                     Back office (not indexed)
/404                                        Not found
```

URLs stay in French: they are visitor-facing and carry SEO weight.

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

## Header

The current header is fixed and transparent with no scrolled state: on the Developer section, the black title passes over the coloured skill logos and becomes unreadable.

The new header stays reachable while scrolling but **takes an opaque background as soon as the page scrolls**, guaranteeing the contrast of its contents whatever passes underneath. It does not shrink enough to shift the layout.

A **skip link** to the main content precedes it in tab order, visible on focus.

## Social links

GitHub, LinkedIn, ArtStation. Currently in a fixed sidebar at `opacity: .2` that overlaps content on mobile — it sits on top of the "Node.js" label in the Developer section.

They stay available on every page but **never overlap content**: the sidebar rejoins the document flow when it no longer has room in the margin. Each link carries an explicit accessible name ("Stéphane Lieumont's GitHub profile"), not just an icon.

The **ArtStation** link deserves a readable placement: it is the reference for the 3D work.

## Footer

Contents: identity, current year, legal notice link, social links, and a **contact prompt**.

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

## Robots and indexing

`/admin` is excluded from indexing and from prerendering. A `sitemap.xml` is generated at build time from published projects, and `robots.txt` references it.
