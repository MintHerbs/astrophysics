---
name: doc-align
description: >-
  Reconcile the project documentation set for internal consistency and against the frozen
  submission. Use after docs are edited, before a PR that touches docs/, or when asked to check that
  the docs agree with each other and with the proposal. Flags drift in the canonical facts (the eight
  target gases, the 8.6 to 11.8 micrometre window, ozone near 9.6 micrometres, the 10 and 50 ppm
  noise floors, 95 percent credibility, the objectives, and the upper-limit framing) and proposes
  edits without applying them.
---

# doc-align: documentation reconciliation

Keep the documentation self-consistent and faithful to the frozen submission. This skill checks, it
does not silently rewrite. It proposes edits and waits for a human to approve them.

## When to use

- After any change under `docs/`, `README.md`, or `CLAUDE.md`.
- Before opening or updating a pull request that touches documentation.
- When a reader reports two docs disagreeing.
- As the first half of a release check (pair with [gap-analysis](../gap-analysis/SKILL.md)).

## Canonical facts (the single source of alignment)

Every doc must state these the same way. Values trace to [docs.txt](../../../docs.txt) and the
verified record in [docs/08-review-and-gaps.md](../../../docs/08-review-and-gaps.md).

- Technosignature gases: CFC-11, CFC-12, SF6, NF3.
- Biosignature gases: ozone (with methane as the disequilibrium pair), DMS, DMDS, methyl chloride.
- Target window: roughly 8.6 to 11.8 micrometres; ozone near 9.6 micrometres.
- Noise floors: 10 ppm (optimistic) and 50 ppm (conservative).
- Reported result: a 95 percent upper credible bound unless the detection threshold is met.
- Detection threshold: 5 sigma across independent channels not explained by any modelled confounder
  (3 sigma is "tentative", never "detected").
- Instrument split: MIRI is the scientific sample; near-infrared is the null control.
- Deliverables: an empirical upper-limit catalogue and a reusable open-source pipeline.

## Procedure

1. Read the doc set: [docs/README.md](../../../docs/README.md) and files 01 through 08, plus
   [README.md](../../../README.md) and [CLAUDE.md](../../../CLAUDE.md).
2. For each canonical fact, grep the docs and confirm every statement matches. Record any mismatch as
   `file:line`, quoting both versions.
3. Check cross-references resolve (every relative link points to a real file and section).
4. Check that any claim contradicting the frozen submission is recorded in
   [docs/08-review-and-gaps.md](../../../docs/08-review-and-gaps.md), not introduced silently.
5. Produce the report below. Propose concrete edits. Do not apply them without a go-ahead.

## Guardrails

- Never edit [docs.txt](../../../docs.txt) or the substance of [proposal.md](../../../docs/proposal.md);
  they are the frozen submission. Corrections live in the working docs and are anchored in docs/08.
  See [.claude/rules/documentation.md](../../rules/documentation.md).
- Cite the canonical source for any fact you assert. Never introduce a number without a source
  (defer to [research-mode](../research-mode/SKILL.md)).
- Propose, do not apply. Alignment edits are still edits and need human approval.
- Stay in scope: do not add or drop gases, windows, or deliverables to force agreement. If the docs
  disagree on scope, flag it for the user rather than picking a side.

## Output format

```
# doc-align report
Canonical-fact drift:
  - <fact>: docs/0X.md:NN says "..."; README.md:MM says "..."  -> proposed fix
Broken cross-references:
  - docs/0X.md:NN -> <target> (missing)
Unanchored contradictions with the submission:
  - docs/0X.md:NN "..." (not recorded in docs/08)
Proposed edits (await approval):
  1. ...
```
