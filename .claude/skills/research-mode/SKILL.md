---
name: research-mode
description: >-
  Disciplined, cited fact-finding for the project. Use whenever a physical value, cross-section,
  instrument parameter, wavelength, detectability figure, unit, or citation is needed or is in doubt,
  or when asked to research a topic or verify a claim. Enforces the project rule to never guess a
  number: every fact must carry a reachable source (DOI, ADS, MAST, NASA Exoplanet Archive, JWST
  docs, HITRAN, petitRADTRANS, PandExo, or the frozen proposal). Outputs claims in the project
  reference format and states a confidence for each. Archive-only: never proposes new observations.
---

# research-mode: cited fact-finding

The project's rule is absolute: a confident wrong number is the worst failure mode. This skill finds
facts and attaches proof, or reports honestly that it could not.

## When to use

- Any time a number, constant, cross-section, instrument parameter, or wavelength is needed.
- Before writing any physical value into docs or code.
- When a claim is challenged, or a citation needs verifying (for citations, prefer
  [ref-check](../ref-check/SKILL.md)).
- When asked to "research", "look up", "confirm", or "find a source for" something.

## Procedure

1. State the exact question and the unit expected (micrometres, ppm, volume mixing ratio, and so on).
2. Search primary and stable sources first: the DOI or ADS record for a paper; HITRAN for
   cross-sections; MAST and the NASA Exoplanet Archive for data; the JWST user documentation for
   instrument parameters; petitRADTRANS and PandExo docs for tool behaviour.
3. Open the source and read the relevant passage. Do not rely on a search-snippet summary for a
   number that will be written down.
4. Record the value, its unit, the source, and a reachable URL. Note the temperature, pressure, or
   resolution regime if it matters (for example, cross-sections valid only near 200 to 300 K).
5. State a confidence: confirmed (read from a primary source), probable (secondary source), or
   unverified (could not reach a source). Never upgrade unverified to a stated fact.

## Guardrails

- Never guess. If no reachable source is found, say "unverified" and stop; ask the user rather than
  invent. See [.claude/rules/documentation.md](../../rules/documentation.md) and
  [.claude/rules/workflow.md](../../rules/workflow.md).
- Reachable references only: a DOI, or a public stable URL (ADS, MAST, NASA Exoplanet Archive,
  HITRAN, petitRADTRANS, PandExo, a published paper, a vendor doc). Never a local path, a localhost
  URL, or a personal cloud link.
- Archive-only: this study takes no new observations and requests no telescope time. Do not propose
  or assume new data collection as a way to answer a question.
- Carry the regime with the number: a cross-section or noise figure without its temperature,
  pressure, or resolution context is not usable. State it.
- Units are explicit and stated at the boundary. Convert carefully and show the conversion.

## Output format

```
Question: <exact question, expected unit>
Finding: <value + unit>
Regime: <T/P/resolution or "n/a">
Source: <citation in project format>  <reachable URL>
Confidence: confirmed | probable | unverified
Notes: <caveats, conflicting sources>
```

Cite in the project reference style used in
[docs/06-references.md](../../../docs/06-references.md).
