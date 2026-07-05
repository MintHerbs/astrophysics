---
name: ref-check
description: >-
  Verify the bibliography. Use before a submission or PR that changes references, or when asked to
  check citations. For each reference, confirm the first author, year, journal, volume, and article
  or page number against a reachable authoritative source (DOI resolver, NASA ADS, or the publisher
  page), and report any discrepancy precisely. Reports only what a reachable source confirms, never
  invents or "corrects" a citation from memory, and flags missing diacritics and typos.
---

# ref-check: bibliography verification

Confirm every citation is real and correctly recorded. This skill checks against sources; it does not
fabricate or infer citation details.

## When to use

- Before submitting a paper or opening a PR that touches [docs/06-references.md](../../../docs/06-references.md).
- When a reviewer or reader questions a citation.
- After adding or editing any reference anywhere in the repo.

## Procedure

1. Collect the references from [docs/06-references.md](../../../docs/06-references.md) and any cited
   inline in docs or code.
2. For each, resolve it: try the DOI first, then NASA ADS (by bibcode or title), then the publisher
   page. Read the record, do not rely on a search snippet.
3. Compare every field: first author (and named co-authors), year, journal, volume, issue, article or
   page number, and title wording.
4. Report each as VERIFIED CORRECT (with the confirming URL) or with the precise discrepancy (for
   example "cited volume 662, actual 660"). If a source cannot be reached, mark it UNVERIFIED and say
   why; do not guess.
5. Flag cosmetic issues separately: missing diacritics (for example Ardevol Martinez, Marquez-Neila,
   Molliere), a dropped colon, or a preprint now published (add the final volume and article).

## Guardrails

- Report only what a reachable source confirms. Never invent a volume, page, or DOI, and never
  "correct" a field to what you expect without confirming it.
- Reachable sources only: DOI, ADS, or publisher. Record the URL you confirmed each fact from.
- Distinguish a factual error (wrong year, volume, author) from a cosmetic one (accent, casing).
- Do not silently rewrite references; propose the correction and let a human apply it.
- Content check, not just format: if the citation is used to support a specific claim, note whether
  the cited paper actually makes that claim (for example, a tentative hint versus a strong detection).

## Output format

```
# ref-check report
1. <citation>  -> VERIFIED CORRECT | discrepancy: <field: cited vs actual> | UNVERIFIED (reason)
   confirmed at: <URL>
...
Cosmetic notes: <diacritics, colons, now-published locators>
Content notes: <citation used for a claim the paper does not fully support>
```
