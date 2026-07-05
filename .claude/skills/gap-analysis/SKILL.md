---
name: gap-analysis
description: >-
  Find gaps between what the project claims and what is real: internal inconsistencies, claims that
  contradict the actual data inventory or code, and scientific statements that contradict external
  reality. Use before a submission, a milestone review, or when asked to audit the project for
  defects. Produces a prioritized, evidence-backed defect list (Critical, Significant, Minor), each
  finding with a file and line, the contradicting evidence with a reachable source, and a proposed
  fix. Every external claim is fact-checked, never assumed.
---

# gap-analysis: claims versus reality

Audit the project for gaps of three kinds and report them ranked by severity. This is the review that
produced [docs/08-review-and-gaps.md](../../../docs/08-review-and-gaps.md); rerun it to keep that
record current.

## When to use

- Before a paper submission, a milestone, or a release.
- When asked to "audit", "find defects", "check for gaps", or "review the project".
- After a large change, to catch drift between docs, code, and data.

## The three gap types

1. Internal inconsistency: two parts of the repo disagree (handled in depth by
   [doc-align](../doc-align/SKILL.md); include a summary here).
2. Claim versus artefact: a doc or comment claims something the real data inventory
   ([data/](../../../data/)) or the code does not support. Example: an inclusion criterion that would
   exclude the whole sample, or a target the archive does not contain.
3. Claim versus external reality: a scientific statement (a band position, an instrument limit, a
   detectability figure, a citation) that a primary source contradicts. These must be fact-checked
   with [research-mode](../research-mode/SKILL.md), never asserted from memory.

## Procedure

1. Inventory the claims: read the docs, code docstrings, and comments; list each checkable assertion.
2. Cross-check against artefacts: load the data inventories and the code, and test each claim that
   refers to them (planet names present, wavelength coverage, modes, units, seeds).
3. Fact-check the external claims: for each physical value, instrument parameter, detectability
   figure, or citation, confirm it against a reachable primary source (DOI, ADS, MAST, NASA Exoplanet
   Archive, JWST docs, HITRAN). Record the source URL.
4. Rank findings: Critical (wrong science or a claim that breaks the pipeline), Significant (accuracy
   or internal consistency), Minor (polish or bibliographic).
5. For each finding, give a failure scenario: the concrete input or reading that makes it wrong.
6. Write the report and, if asked to record it, extend docs/08 rather than overwriting it.

## Guardrails

- No unverified assertions. If you cannot reach a source, mark the finding "unverified" and say so;
  do not present a guess as a defect or as a clearance.
- Separate the gap types. Do not label an internal wording choice a "contradiction with reality", and
  do not fix an external error by editing only one doc.
- Respect the frozen submission: defects in [docs.txt](../../../docs.txt) are recorded in docs/08 and
  corrected in the working docs, never edited in place.
- Report, do not fix, unless explicitly asked to apply fixes. Even then, one finding at a time with a
  visible diff.
- Stay on the project goal: a finding is not "the study should detect instead of limit" or "add gas
  X". Scope changes are the user's call (see [scope-guard](../scope-guard/SKILL.md)).

## Output format

```
# gap-analysis report (level: <low|medium|high>)
## Critical
  C1. <one-line defect>
      Where: <file:line>
      Evidence: <contradicting artefact or source + URL>
      Failure: <concrete wrong input -> wrong output>
      Fix: <proposed change>
## Significant
  S1. ...
## Minor
  M1. ...
Verified-correct (spot list): <claims checked and found sound, with sources>
```
