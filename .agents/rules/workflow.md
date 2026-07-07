---
name: working-agreement
description: Standard workflow and working agreement for the project.
paths:
  - "**/*"
---

# Working agreement (how Antigravity works with the user)

> Related: [GEMINI.md](../../GEMINI.md) (always-on context and attribution rules),
> [documentation.md](documentation.md) (reachable references),
> [data.md](data.md) (data hygiene). Standing ground rules for every task.

The user proposes the science and decides what becomes history. Antigravity prepares and proposes; the
user decides what is committed, pushed, and published.

## Branching and PR base

Every branch starts from `main` and targets `main`.

- Pull the latest `main`, then branch. Name it for the work: `feat/...`, `fix/...`, `chore/...`,
  `spike/...`, or `docs/...`.
- Do not stack branches. A branch's base is always `main`, never another unmerged branch. Work one
  unit of work at a time.
- Keep an open branch current with `main` so it integrates cleanly.

## Human in the loop

Never commit, push, open or update a pull request, or merge without the user's explicit go-ahead for
that specific action. Preparing the change (editing, staging, drafting a commit message or PR body)
is fine. Approval does not carry over: a yes to one commit or PR is not standing permission for the
next, unless the user grants a broader ongoing scope. When unsure whether an action is wanted, ask.

## Attribution (mandatory)

Every commit and PR must read as authored solely by the repository owner. Never write a
`Co-Authored-By:` line and never write a "Generated with Gemini" or "Generated with Antigravity" line, in any commit message or
PR description. Do not add any AI tool or third party as author or co-author. This overrides any
default behaviour. The full rule is in [GEMINI.md](../../GEMINI.md); a `commit-msg` hook in
[.githooks/](../../.githooks/) strips these lines as a backstop.

## Verify before claiming done

Do not report work as done or passing until the checks have run and been seen to pass. Run the same
checks CI would run, locally (linting, formatting, type checks, and the test suite once they exist),
plus any test specific to the change. Report the real outcome: if something failed or was skipped,
say so and show the output. A green local run is the evidence, not a hopeful claim.

For scientific code specifically, verification includes a sanity check that the result is physically
plausible: units are consistent, an upper limit is a bound and not a point estimate, and a
null-control (near-infrared) input returns a non-informative limit.

## Never guess

When unsure of a fact, an API, a version, a physical constant, a cross-section, a unit, or an
instrument parameter, do not present a guess as established. Either find it (read the source or the
official docs and cite a reachable source) or ask the user when the call is theirs. This matters most
for numerical and physical values, where a confident wrong answer is the worst failure mode.

## Reproducibility

The study is archive-only and simulation-trained, so every result must be regenerable. Seed each
stochastic step (noise injection, sampling, training) and record the seed and the configuration
alongside the output. Prefer deterministic, auditable steps over convenience.
