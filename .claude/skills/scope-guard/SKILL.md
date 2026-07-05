---
name: scope-guard
description: >-
  Pre-flight check that a proposed change stays inside the project's hard invariants, run before a
  large edit, a new module, or a design decision. Reads the project invariants in CLAUDE.md and
  refuses to green-light changes that would take new observations, replace a posterior with a point
  estimate, build a denoiser-then-detector chain, add or drop target gases, promote near-infrared to
  the scientific sample, weaken the detection threshold below 5 sigma, or edit the frozen submission.
  Returns a clear pass or a blocked verdict with the specific invariant at risk.
---

# scope-guard: stay on the project goal

A fast gate that answers one question: does this change keep the project on its fixed goal? Run it
before committing to a direction, so effort is not spent on work that violates an invariant.

## When to use

- Before starting a large edit, a new `src/` module, or a design change.
- When a request could be read as changing the project's scope or method.
- When unsure whether an idea fits the archive-only, upper-limit, probabilistic paradigm.

## The hard invariants (from CLAUDE.md)

A change must not:

1. Take new observations or assume new telescope time. The study is archive-only.
2. Replace a posterior with a point estimate, or use a single-value regressor as the result. The
   result is probabilistic by necessity.
3. Build a denoiser-then-detector chain. Noise teaches uncertainty; it is not removed.
4. Claim a detection below 5 sigma across independent channels not explained by a confounder.
5. Add or drop target gases, or change the target windows, without explicit user sign-off. The scope
   is the four technosignature and four biosignature gases in the 8.6 to 11.8 micrometre window
   (ozone near 9.6 micrometres).
6. Promote near-infrared data to the scientific sample. MIRI is the sample; near-infrared is the
   null control.
7. Drop the classical-versus-NPE cross-check, or the reproducibility discipline (seed and record
   every stochastic step).
8. Edit the frozen submission ([docs.txt](../../../docs.txt), and the substance of
   [proposal.md](../../../docs/proposal.md)). Corrections go to the working docs and
   [docs/08-review-and-gaps.md](../../../docs/08-review-and-gaps.md).
9. State a physical number without a reachable source.
10. Add AI or third-party attribution to a commit or PR, or commit raw or bulk data.

## Procedure

1. Restate the proposed change in one sentence.
2. Walk the ten invariants; mark each as not-at-risk, or at-risk with the reason.
3. If any is at-risk, return BLOCKED and name the invariant; suggest an in-scope alternative if one
   exists. A genuine scope change is the user's decision, so escalate rather than proceed.
4. If none is at-risk, return PASS with a one-line rationale.

## Guardrails

- This skill only clears or blocks; it does not itself make the change.
- It never grants a scope change on its own authority. Only the user can widen or alter the goal, and
  that decision is recorded.
- When in doubt, block and ask. A false pass that lets the project drift is the costly error.

## Output format

```
# scope-guard
Change: <one sentence>
Invariant review:
  1 archive-only: ok | AT RISK (why)
  ... (through 10)
Verdict: PASS (rationale) | BLOCKED (invariant N: reason; in-scope alternative)
```
