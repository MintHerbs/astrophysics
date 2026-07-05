---
name: sci-verify
description: >-
  Scientific sanity gate. Run before any result, figure, or physical number enters the docs or the
  code, and before reporting a result as done. Checks that units are consistent and stated, that a
  reported limit is an upper credible bound and not a point estimate, that a near-infrared
  null-control input returns a non-informative limit, and that every stochastic step has a recorded
  seed and configuration. Blocks any detection claim below 5 sigma across independent channels, any
  denoiser-then-detector pattern, and any point estimate standing in for a posterior.
---

# sci-verify: scientific plausibility gate

A result is not done until it is physically plausible and reported in the project's discipline. This
skill is the checklist that stands between a computed number and a written claim. It extends the
"verify before claiming done" rule for scientific code in
[.claude/rules/workflow.md](../../rules/workflow.md) and
[.claude/rules/science.md](../../rules/science.md).

## When to use

- Before writing any result or physical value into a doc, a figure caption, or a table.
- Before reporting a pipeline output as correct or done.
- When reviewing a retrieval, an NPE posterior, or an upper-limit calculation.

## Checklist

1. Units: every quantity has an explicit unit and it is consistent through the calculation.
   Wavelengths in micrometres, noise in ppm, abundances as volume mixing ratios unless stated.
2. Upper limit is a bound: the headline number is a tail quantile of a posterior (for example the
   95 percent bound), not a maximum-likelihood point estimate. A single-value regressor output is
   never an acceptable result.
3. Detection discipline: a "detection" is claimed only above 5 sigma across multiple independent
   channels that no modelled confounder explains. Between 3 and 5 sigma is "tentative". Otherwise it
   is a null result reported as an upper limit.
4. Null control: a near-infrared input, where no strong target band exists, must return a
   non-informative (wide) limit. If it returns a confident detection, the pipeline is wrong.
5. Physical regime: the opacities used are valid for the planet's temperature (the target-gas
   cross-sections are terrestrial-temperature; do not apply them to hot planets). See
   [docs/08-review-and-gaps.md](../../../docs/08-review-and-gaps.md) C2.
6. Reproducibility: every stochastic step (noise injection, sampling, training) has a recorded seed
   and configuration alongside the output.
7. Cross-method agreement: where both exist, the NPE posterior and the nested-sampling posterior
   agree within their stated uncertainties.

## Guardrails (hard blocks)

- Block any detection claim that does not clear 5 sigma across independent channels. Downgrade it to
  a tentative signal or an upper limit.
- Block any denoiser-then-detector pattern: it erases sub-noise signal and discards uncertainty.
  Noise is injected to teach uncertainty, not to be removed.
- Block any point estimate presented as the result. The result is a posterior and its credible bound.
- Block any physical number lacking a unit or a source (defer to
  [research-mode](../research-mode/SKILL.md)).
- Never relax these to make a result look stronger. Report the honest outcome, including failures.

## Output format

```
# sci-verify
Units consistent: pass | FAIL (detail)
Upper limit is a bound: pass | FAIL
Detection discipline (>=5 sigma): pass | n/a | FAIL
Null control non-informative: pass | untested | FAIL
Opacity regime valid for target T: pass | FAIL
Seeds and config recorded: pass | FAIL
Cross-method agreement: pass | n/a | FAIL
Verdict: OK to report | BLOCKED (reasons)
```
