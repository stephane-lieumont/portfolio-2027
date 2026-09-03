# Decisions

What Stéphane has settled, and what is still open. A decision here is his, not
an inference — if it is not sourced to something he said, it does not belong.

## Settled

**2026-09-03 — Media lives in MinIO, not in the repository.** "c'est image
doivent etre dans un serveur minio", against a recommendation to ship them in
`public/` for V1. The bucket is the store of record; the site reads bucket keys
joined onto an injected base, so the templates hold no origin. Seeded once with
`pnpm --filter @portfolio/api media:seed`. Chrome assets — the split
backgrounds, the Travolta gif, fonts, the CV — stay in the repository: they are
design, not content, and nothing will ever upload them.

**2026-09-03 — Media stays as it is.** The CV and the 3D pieces already in
`Portfolio_2022` are what ships. No new shoot, no new renders, no reselection:
"pour le cv et les element 3D conserve ce qui est présent actuellement."
The 3D work dates from 2014–2016 and that is accepted rather than hidden.

**2026-09-03 — ArtStation is `https://www.artstation.com/s-lieumont`.** The
subdomain form previously in `contact.html` was invented and wrong.

**2026-09-03 — First deploy replaces the live site.** The 2027 build takes over
`stephane-lieumont.fr` directly; there is no staging address first. This raises
the stakes on SEO: the current site is indexed, and every old URL that has no
equivalent becomes a 404 the day of the switch.

**Earlier — Static pages before the API.** Content lives in the app until the
back office exists, shaped like spec 03's entities so the swap is a change of
source rather than a rewrite.

**Earlier — Demo links are proxied by nginx** on the same host, so they stay
root-relative (see ADR-0005 and `production-constraints.md`).

**Earlier — Stéphane is the sole commit author.** Never a co-author trailer.
His personal address, `stephane1920@gmail.com`, not the work one.

**Earlier — No phone number on the Contact page.**

## Open

**Contact delivery — free and reliable.** Stéphane's words: "on discutera d'une
solution gratuite et fiable." ADR-0007 forbids sending from the browser, so this
needs a service and a key in `.env`. Until it is chosen the form renders and
goes nowhere, which is worse than no form. _Blocks: the Contact page being
honest._

**Images in the repo, or through MinIO?** ADR-0012 planned a pipeline. The
recommendation on the table: repo for V1 — the pieces are fixed, they cannot
change without a commit anyway, and MinIO only earns its keep once something
uploads to it. _Blocks: nothing yet; the recommendation stands unless refused._

**Old URLs on the day of the switch.** The 2022 site used hashed paths like
`/portfolio-stephane-lieumont-cgi`. Someone has to decide whether they redirect
or 404. _Blocks: the deploy, and it is easy to discover too late._
