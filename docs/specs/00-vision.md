# Spec 00 — Vision, audiences and principles

> The site's visitor-facing copy is written in **French**. This document, like all project documentation, is in English.

## What the site must produce

Two outcomes, in this order:

1. **Get contacted about salaried opportunities.**
2. **Find freelance development work.**

3D is not a third objective. Stéphane frames it himself as _« une passion que j'aimerais exposer, une plus-value sur mon apprentissage autodidacte »_ — a passion he wants to show, and evidence of self-taught learning. It serves the two objectives above by proving an ability to learn independently and an eye for visuals — two rare qualities in a developer. **No commercial call to action on the 3D side.**

Every trade-off is settled by asking: _does this move a qualified visitor closer to making contact?_

## Positioning

**Lead Tech / technical referent**, replacing "Développeur Fullstack & Graphiste 3D".

The site puts **technical judgment, mentoring and ownership** forward as much as code output. The tone is no longer that of a career changer justifying his legitimacy, but of someone who makes calls and stands behind them.

His trajectory — 14 years in aerospace, then a career change — remains an argument. It explains an engineer's rigor paired with a visual sensibility, a combination you rarely find together. It must stop being phrased as an apology.

## Audiences

| Visitor              | What they want                             | What they must find in 30 seconds                             |
| -------------------- | ------------------------------------------ | ------------------------------------------------------------- |
| **Recruiter / HR**   | A profile matching a job description       | The positioning, the technologies, the CV                     |
| **CTO / tech lead**  | Evidence of level and judgment             | The work, the exact role held, the quality of the site itself |
| **Freelance client** | Someone who can carry a project end to end | Concrete deliverables, autonomy, contact                      |
| **Peer / curious**   | The 3D work                                | The gallery, and the ArtStation link                          |

The site is itself part of the case: a technical recruiter who opens the dev tools must find the competence the copy claims. That is the reason for the semantics (ADR-0010) and responsive (ADR-0011) requirements.

## Technologies to put forward

**Angular, TypeScript, RxJS/Signals, .NET/C#, Docker, CI/CD, Git, React.**

**Flutter comes off** the list of highlighted skills — Stéphane no longer wants to be approached for it. The Case Tes Potes Mobile project stays in the work section: it is part of his record, and the one carrying the most responsibility.

The 2022 skill list (Vue.js, React.js, Flutter, Webpack, Sass, Node.js) is stale and is not carried over.

## Design principles

**The design is the frame, the images are the product.** If a UI element competes with a render, the element is wrong.

**The theme follows the content**: light for the home page and the development section, dark for 3D. That decision comes from the current site; it is kept and made deliberate.

**Nothing important hides behind a hover.** Not on mobile, not on desktop.

**The site must look alive.** The current footer reads "©2026" while the latest project dates from 2022; the gap is noticed. See spec 05 on freshness signals.

## What carries over from the current site

Stéphane is happy with the overall look: this is a refresh, not a blank slate.

Kept: the **orange accent** as a signature, the **full-screen background** at first contact, the **dual dev / 3D path** from the home page (confirmed — no unified filtered list), the Home / Developer / 3D / Contact structure, the downloadable CV, and the **care given to motion**, to be recalibrated rather than removed.

Dropped: the **opening quotation** attributed to a third party, and the **stale skill list**.

## Related documents

- [Spec 01 — Site map and navigation](01-site-map-navigation.md)
- [Spec 02 — Pages](02-pages.md)
- [Spec 06 — Design system](06-design-system.md)
