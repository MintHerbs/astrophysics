---
paths:
  - "**/*"
---

# Specs and tickets

> Related: [workflow.md](workflow.md) (human in the loop, verify before done).

When a piece of work is spec'd out (a design or plan is written down before implementation begins),
the spec and the tickets derived from it live in dedicated top-level folders, not scattered next to
the code they describe.

## Where things go

- [spec/](../../spec/): one file per spec, named `<topic>-spec.md` (for example
  `spec/raw-data-grid-spec.md`). The spec captures the problem, the approach, and the scope
  boundaries agreed with the user before implementation starts.
- [ticket/](../../ticket/): the tickets broken out from a spec, named `<topic>-<NN>-<short-name>.md`
  (for example `ticket/raw-data-grid-01-column-highlights.md`), where `<topic>` matches the spec it
  came from. Each ticket is one discrete, independently completable unit of work.

## The rule

- Writing a spec means saving it to `spec/`, not to `docs/`, not inline in the conversation, and not
  next to the code.
- Breaking a spec into tickets means saving each ticket to `ticket/`, referencing its source spec by
  relative link (`../spec/<topic>-spec.md`) at the top of the ticket.
- A ticket never introduces scope the spec did not cover. If implementation reveals new scope, update
  the spec first, then the tickets.
- This applies everywhere in the repo (root, `frontend/`, `src/`), since planning precedes
  implementation in any part of the project.

This rule is about working documents for planning, not the frozen submission: it does not touch
[docs.txt](../../docs.txt) or [docs/](../../docs/), which remain governed by
[documentation.md](documentation.md).
