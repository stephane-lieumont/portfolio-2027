# Runtime

Where the project actually stands, kept current as work lands.

This is deliberately separate from `.claude/memory/`. Memory holds what stays
true — the stack, the design system, Stéphane's profile, the production
constraints. Runtime holds what changes every session: what is built, what is
not, what is waiting on a decision.

| File                         | Answers                                           |
| ---------------------------- | ------------------------------------------------- |
| [STATUS.md](STATUS.md)       | What works today, and what is missing             |
| [DECISIONS.md](DECISIONS.md) | What Stéphane has settled, and what is still open |
| [LOG.md](LOG.md)             | What shipped, in order                            |

## Rules

- **Update STATUS.md in the same commit as the work**, not afterwards. A status
  file that lags is worse than none: it is read as true.
- **Never write an aspiration as a fact.** ADR-0008 settled on prerendering and
  it went undone for weeks while a comment in `index.html` claimed the site was
  prerendered. A decision recorded is not a thing built — the two live in
  different files here for that reason.
- **An open question names who it blocks.** "Waiting on Stéphane" with no stated
  consequence gets forgotten by both of us.
- Dates are absolute. "Last week" means nothing three sessions later.
