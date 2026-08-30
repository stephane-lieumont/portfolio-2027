---
name: new-adr
description: Create a local Architecture Decision Record in docs/adr/ from the repo template. Use when a structural decision is made on Portfolio 2027 — library choice, architecture pattern, data model, infrastructure or deployment strategy. Distinct from the global "adr" skill that publishes to Notion: this one stays versioned in the repository.
---

# Creating a local ADR

The ADRs in this repo live in `docs/adr/` and are versioned alongside the code. An ADR pins down the _why_ of a decision, so nobody reopens it six months later without remembering the constraints of the time.

## When to write an ADR

Write one when the decision is **expensive to reverse** or **surprising to a reader**: adding a structural dependency, changing the data model, choosing an auth or caching strategy, passing up an obvious approach for a non-obvious reason.

Do not write one for a local, reversible choice — naming a variable, splitting a component, adding a field. The value of an ADR folder is its density: twenty trivial ADRs bury the three that matter.

## Procedure

1. List `docs/adr/` and take the next number, on 4 digits.
2. Copy `docs/adr/0000-template.md` to `docs/adr/NNNN-title-in-kebab-case.md`.
3. Fill in the sections. The most important is **Consequences** — that is the one people come back to. It must include the downsides accepted, not just the benefits.
4. Under **Alternatives rejected**, say why each one was. An alternative listed without a reason helps no one.
5. Status `Accepted` once the decision is made. If an earlier ADR is replaced, set it to `Superseded by ADR-NNNN` and reference it from the new one.
6. Update `.claude/memory/tech-stack.md` if the decision changes the technical foundation.

## Tone

Write the context in the past tense, the decision in the present. Be straight about the trade-offs: an ADR that only presents advantages has not done its analytical work.
