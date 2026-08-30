# ADR-0008 — Static prerendering at build time (SSG)

- **Status**: Accepted
- **Date**: 2026-08-31

## Context

The 2022 portfolio is a React SPA with no server rendering: content is injected by JavaScript after load. Auditing the live site measured what that actually costs.

There is a single `meta description` for the entire site, no canonical, no JSON-LD. The `og:image` tag is `//preview.jpg` — a protocol-relative URL with no host, therefore **broken**: sharing a portfolio link on LinkedIn or Slack produces no preview at all. The `og:description` only describes the 3D profile although the site is mixed, and `og:url` points at `www.stephane-lieumont.fr` when the site is served without `www`.

That's a direct problem for what the site is for: Stéphane is looking for salaried opportunities and freelance work. A portfolio that doesn't render properly when shared, and whose indexing depends on Google's own JavaScript rendering, is starving its main channel.

The content, meanwhile, is thoroughly static: a few dozen projects, updated a few times a year by one author.

## Decision

The site is **prerendered to static HTML at build time**, using Angular 22 prerendering (`outputMode: 'static'`).

Each route produces a complete HTML file, metadata included. Project routes are enumerated at build time by querying the API, which therefore becomes a **build dependency** rather than only a browser-runtime one.

nginx serves those static files. The API is no longer hit by visitors to read projects: it serves only the back office and the contact form.

Every page carries its own `title`, `meta description`, canonical, Open Graph and JSON-LD, rendered into the delivered HTML rather than added by script.

Publishing or editing a project from the back office **triggers a site rebuild**.

## Consequences

The HTML is complete in the first response: Google, LinkedIn and share previews see the real content without executing any JavaScript. That's the benefit we're after, and it doesn't exist without server-side rendering.

Performance follows: no waiting on a network call to display a project list, and an LCP that depends only on the cover media.

The infrastructure stays the one described in ADR-0005 — nginx serving static files. **No Node process is needed to serve the public site**, which means an API outage leaves the portfolio online and browsable. For a showcase, that property is worth a lot.

The trade-off, and it's the real cost: **publishing is no longer instant**. Saving a project in the back office doesn't make it visible until the rebuild has run. That calls for an automatic trigger and visible feedback in the back office on publication status, or Stéphane will find himself wondering why his project isn't showing up.

The API becomes a build dependency: if it's unavailable at build time, the build fails. That's better than a build silently producing a site with its projects missing, but it means CI depends on one more service.

Prerendering freezes the data as of build time. Genuinely dynamic content is impossible without a client call — acceptable here, where only the contact form needs the API at runtime.

## Alternatives considered

**On-the-fly SSR** — instant publishing and the same SEO quality. Rejected because it requires running and monitoring a Node process to serve pages that change a few times a year, and because it makes the site's display depend on the API's health. Prerendering delivers the same result for the visitor with one moving part fewer.

**SPA with fixed metadata** — the minimum: repair `og:image`, write per-page descriptions. Rejected because it only half-fixes the problem. Metadata injected after the fact still depends on crawlers' JavaScript rendering, whose timing and per-platform behaviour we don't control. On the channel that brings in recruiters, half isn't enough.

**Hybrid: prerender the fixed pages, client-render the projects** — more flexible, but the project pages are precisely the ones we want indexed and shared. Prerendering everything except what matters makes no sense.

**Generating the site from a folder of Markdown files, no API** — simpler still, and the classic choice for a portfolio. Rejected because Stéphane explicitly asked for a back office to write his projects and manage his 3D images without touching code: going back to versioned files would defeat the purpose of the project.
