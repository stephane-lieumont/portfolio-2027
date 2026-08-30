---
name: content-guidelines
description: Editorial line for the portfolio — tone, structure of project copy, SEO, and the fixes to apply to the current wording. All visitor-facing copy is written in French.
metadata:
  type: project
---

# Editorial line

**Language:** this file is written in English, like the rest of the repository's documentation. **The copy it governs is written in French** — the site is French-speaking and that is settled. Quotations from the current site below are kept in French: they are audit evidence, not text to translate.

## Purpose of the site

It is the **shop window for what Stéphane does and what he offers**. The typical reader — recruiter, CTO, client — gives it thirty seconds before deciding whether to keep going. Every piece of copy is judged against that.

Two commercial goals, in this order: **salaried opportunities**, then **freelance dev work**. See [[user-profile]].

**The 3D section sells nothing.** Stéphane presents it as a passion and _« une plus-value sur mon apprentissage autodidacte »_ (an asset to his self-taught learning). It proves an ability to learn alone and an eye — two qualities that serve his case as a developer. No commercial call to action belongs there.

## Positioning

**Lead Tech / technical referent** replaces « Développeur Fullstack & Graphiste 3D ». The copy puts **technical arbitration, mentoring and responsibility** forward as much as writing code. The tone is no longer that of a career changer justifying himself, but of someone who makes the calls.

## Tone

First person, French, professional without stiffness. **Concrete over grandiose**: « j'ai développé l'application mobile en Flutter » (I built the mobile app in Flutter) beats « passionné par l'innovation » (passionate about innovation).

Forbidden: unverifiable superlatives, marketing jargon, emoji. Never invent a skill, a client, a date or a figure — a portfolio that exaggerates turns against its author in the interview.

## Structure of a project description

Inherited from the current site; it works and it stays:

1. **Context** of the project — what the product was.
2. **Stéphane's mission** precisely — that is what interests the reader.
3. **Concrete steps** — the real deliverables.

When he led, say so. When he executed, say that too: honesty about scope is more credible than an inflated role.

Every project has a short `summary` for cards and a long `description`. **The summary is not the first paragraph truncated**: it is written for its own purpose.

## SEO

A unique `title` and `meta description` per page, written for a human first. « Stéphane Lieumont » must appear in the titles: name searches bring most of a portfolio's traffic.

## Wording to revise — audit of the current site

Stéphane asked for a wording revision. Points already identified.

### Spelling mistakes

These are French spelling corrections — both columns stay in French.

| Where                 | Current                                               | Correct        |
| --------------------- | ----------------------------------------------------- | -------------- |
| Home `h2`, navigation | « Developpeur Fullstack »                             | Développeur    |
| Contact               | « une question **où** juste un Hello World ? »        | ou             |
| 3D gallery alt        | « **imeuble** photo-réaliste »                        | immeuble       |
| 3D gallery alt        | « exterieur **photo-réalise** »                       | photo-réaliste |
| 3D gallery heading    | « **Exterieur** »                                     | Extérieur      |
| CSS classes           | `theme-ligth`, `header--ligth`, `homepage__rigthside` | light / right  |

### Content to rework

- **The opening quotation goes** (see [[design-system]]). The home page hook has to be rewritten to say directly what Stéphane does and offers — it is the first text a recruiter reads, it has to work. The current subtitle « Développeur Fullstack & Graphiste 3D » is factual but says _what he is_, not _what he offers_.
- **« Après une reconversion dans le domaine il y a 5 ans »** — a phrasing built on relative years goes stale on its own. Use a date instead.
- The tone of the Developer section is **aimed at legitimizing himself** (« mon potentiel », « mes objectifs ») rather than at the value he brings. That is the career changer's reflex; it no longer applies.
- The **project descriptions are written markedly better** than the section pages — they already have the context → role → deliverables structure. That is the level to reach everywhere.
- **Irregular French/English mixing**: « lead developer », « Users Stories », « Roadmap produit », « Hello World », « Designed & Developed on React ». Settle on one rule and hold it.
- **The 3D section has no introductory copy at all** — only images. A 3D client has nothing to read.

### Factual inconsistencies

- The footer shows **« ©2026 »** while the most recent project dates from **2022**: the site looks abandoned.
- « Designed & Developed on **React** » to be updated after the Angular migration.
- The downloadable CV is named **`CV_LIEUMONT-stephane_2024_FrontEnd.pdf`** while the site positions him as « Fullstack ».
- Contradictory dates between the carousel and the 3D gallery: « Escart Wild © 2015 » vs « Escart wild — 2014 »; « Légos minions © 2015 » vs the file `Lego-Minions-2016`.

### Broken SEO

- `og:image` = `//preview.jpg` — protocol-relative with no host, so **no preview when shared**.
- `og:description` covers **only the 3D profile** (« CG Artist Toulouse | Portfolio 3D — Zbrush, 3DSmax, Vray… ») while the site is mixed.
- `og:url` points at `www.stephane-lieumont.fr` while the site is served **without `www`**.
- A single global `meta description`, no canonical, no JSON-LD, and no server rendering: the content is injected by JS.

## Recurring elements

Downloadable CV, contact form, GitHub / LinkedIn / ArtStation links. Sections: Accueil, Développeur, Graphisme 3D, Contact.

The **project detail pages have no outbound links**: none to the live project, none to GitHub, none to the next project. The visitor lands in a dead end.

See [[user-profile]] for approved biographical facts and [[design-system]] for the visual frame.
