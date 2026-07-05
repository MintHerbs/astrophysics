---
paths:
  - "src/**"
  - "docs/02-methodology.md"
  - "docs/08-review-and-gaps.md"
---

# Scientific guardrails (modelling, inference, and reporting)

> Applies to the science code and the methodology docs. The always-on version is the "Principles" and
> "Project invariants" in [CLAUDE.md](../../CLAUDE.md). The `sci-verify` skill is the runnable
> checklist. Background and evidence: [docs/08-review-and-gaps.md](../../docs/08-review-and-gaps.md).

These rules exist so the science does not drift from the project's paradigm: archive-only,
simulation-trained, probabilistic, upper-limits-first, and reproducible.

## The result is a posterior, never a point estimate

An upper limit is a tail quantile, so the model must be probabilistic. Never replace a posterior with
a maximum-likelihood value, a mean, or a single-value regressor output. The headline number for each
planet and gas is an upper credible bound (for example the 95 percent bound), reported with the
posterior it came from.

## Noise teaches uncertainty; do not denoise

Injected noise is there to teach the model how much uncertainty to report and to widen its posterior,
not to be removed. Do not build a denoiser-then-detector chain: it erases the sub-noise signal the
upper limit depends on and discards uncertainty. A single noise-aware model maps a noisy spectrum
directly to a posterior.

## Detection discipline

- Report an upper credible bound (95 percent) unless the detection threshold is met.
- A detection needs a feature above five standard deviations across multiple independent spectral
  channels that no modelled confounder explains.
- Between three and five standard deviations is reported as tentative, not detected. This is stricter
  than the original proposal's three-sigma wording, for the reason recorded in
  [docs/08-review-and-gaps.md](../../docs/08-review-and-gaps.md) S2 (the contested K2-18b claim sat
  near three sigma).

## Opacities must be valid for the planet's temperature

The target-gas cross-sections (CFC-11, CFC-12, SF6) are laboratory measurements valid only near
terrestrial temperatures (roughly 190 to 300 K). They must not be applied to hot planets. Restrict
the technosignature retrieval to the cool and temperate subset of the sample. See
[docs/08-review-and-gaps.md](../../docs/08-review-and-gaps.md) C2.

## Cross-sections versus line lists

State the opacity source type correctly. In HITRAN2020, CFC-11, CFC-12, and SF6 are experimental
absorption cross-sections; NF3 is a line-by-line species. Write "cross-sections and line lists", not
"cross-sections" alone, when the set includes NF3.

## Units are explicit

Wavelengths in micrometres, noise in ppm, abundances as volume mixing ratios unless stated. State the
unit in the variable name or docstring, and prefer Astropy units at boundaries. Show any conversion.

## Null control must stay non-informative

A near-infrared input, where no strong target band exists, must return a wide, non-informative limit.
A confident detection there is a bug, not a discovery.

## Reproducibility

Seed every stochastic step (noise injection, sampling, training) and record the seed and the full
configuration alongside the output, so any result can be regenerated exactly.

## Never guess a number

Every physical constant, cross-section, instrument parameter, unit, or wavelength carries a reachable
source, or you ask. Use `research-mode`. See [documentation.md](documentation.md).
