# JWST Technosignature and Biosignature Gas Search

A reproducible, archive-only machine-learning pipeline that searches the James Webb Space Telescope
(JWST) exoplanet transmission-spectroscopy archive for industrial technosignature gases and selected
gaseous biosignatures, and reports the first empirical, quantitative upper limits on their
atmospheric abundances. This file holds the always-on context and rules. Longer background lives in
[docs/](docs/); path-scoped rules in [.claude/rules/](.claude/rules/) add depth on demand. The
submitted proposal is kept verbatim at [docs.txt](docs.txt) and is the source of truth.

## What this project is

The study is computational, archive-only, and simulation-trained. No new observations or telescope
time are used. The paradigm is supervised Bayesian inference for spectral unmixing: train a model on
simulated spectra whose true gas abundances are known, then apply it to real archival spectra to
infer each gas's abundance with its uncertainty.

The headline deliverable is an upper-limit catalogue, not a detection. An actual detection with the
present archive is extremely unlikely, so a rigorously derived non-detection is the intended, and
publishable, result. Frame every result as an upper credible bound unless the detection threshold is
met.

## Target gases

Technosignatures (primary), no significant natural source, mid-infrared features between roughly 8.6
and 11.8 micrometres:

- CFC-11 (trichlorofluoromethane)
- CFC-12 (dichlorodifluoromethane)
- SF6 (sulphur hexafluoride)
- NF3 (nitrogen trifluoride)

Biosignatures (secondary), same MIRI window: ozone (assessed with methane as a disequilibrium pair),
plus dimethyl sulfide (DMS), dimethyl disulfide (DMDS), and methyl chloride.

Confounders modelled deliberately (their absorption overlaps the target bands): methane, ammonia,
hydrogen sulphide, clouds, and temperature structure.

## Key terminology

- Transmission spectroscopy: measuring the starlight filtered through a planet's atmosphere during
  transit to reveal which gases absorb at which wavelengths.
- MIRI: JWST's Mid-Infrared Instrument. The target gas features are mid-infrared, so the MIRI subset
  is the scientifically meaningful sample. Near-infrared spectra, behind most of the archive, serve
  as demonstration and null-control data, because the target gases have no strong diagnostic band there.
- Forward model: given known gas abundances, compute the spectrum they produce (petitRADTRANS here).
  The only way to make labelled training data, since no real spectrum has a measured true abundance.
- Retrieval: the inverse problem, inferring abundances from a spectrum. Classical retrieval here uses
  nested sampling (dynesty, MultiNest, or UltraNest) as a rigorous baseline.
- NPE (neural posterior estimation): a fast, amortised machine-learning method that maps a noisy
  spectrum directly to an abundance posterior. Preferred over Monte Carlo dropout, which is least
  reliable in the distribution tail where the upper limit lives.
- Posterior and upper limit: the result for each planet and gas is a posterior distribution; the
  reported upper limit is its upper credible bound (for example the 95 percent bound).
- ppm noise floor: the residual systematic noise the pipeline assumes. Two floors are used, an
  optimistic 10 ppm and a conservative 50 ppm.

A fuller glossary lives in [docs/05-glossary.md](docs/05-glossary.md).

## Principles (always apply)

- Upper limits, not hype. Report an upper credible bound (for example the 95 percent bound) unless
  the detection threshold is met. A positive detection is claimed only for a feature exceeding five
  standard deviations across multiple independent spectral channels that cannot be explained by any
  modelled confounder; between three and five standard deviations is reported as tentative, not
  detected. See [docs/08-review-and-gaps.md](docs/08-review-and-gaps.md) S2.
- Probabilistic by necessity. An upper limit is a tail quantile, so the model must be probabilistic.
  A single-value regressor cannot express the required result. Never replace the posterior with a
  point estimate.
- Noise teaches uncertainty, not denoising. Injected noise exists to teach the model how much noise
  is present and to widen its uncertainty accordingly, not to be removed. Do not build a
  denoiser-then-detector chain: it erases sub-noise signal and discards uncertainty.
- Two methods, cross-checked. The classical nested-sampling retrieval gives the trustworthy headline
  limits; the amortised NPE model gives the scalable, reusable artefact. Results must agree.
- Reproducible and archive-only. No new observations. Seed every stochastic step and record it, so a
  result can be regenerated exactly.
- Never guess a number. For any physical constant, cross-section, unit, instrument parameter, or
  wavelength, find and cite a reachable source or ask, rather than presenting a guess. A confident
  wrong number is the worst failure mode in this project.

## Project invariants (hard constraints)

These are non-negotiable. A change that would violate one is out of scope until the user explicitly
decides otherwise. The `scope-guard` skill checks a proposed change against this list; the principles
above give the reasoning, and this is the enforceable checklist.

1. Archive-only. No new observations and no telescope time. Never propose collecting new data.
2. Upper limits, not detections. The default result is a 95 percent upper credible bound. A detection
   needs five standard deviations across independent channels not explained by any confounder.
3. Probabilistic by necessity. The result is a posterior and its credible bound, never a point
   estimate and never a single-value regressor.
4. Noise teaches uncertainty. No denoiser-then-detector chain.
5. Two methods, cross-checked. The classical nested-sampling retrieval and the NPE model must agree.
6. Never guess a number. Every physical value carries a reachable source, or you ask (use
   `research-mode`).
7. Fixed target scope. The four technosignature and four biosignature gases, in the 8.6 to 11.8
   micrometre window (ozone near 9.6). MIRI is the scientific sample; near-infrared is the null
   control. Do not add or drop gases, or promote near-infrared to the sample, without sign-off.
8. Frozen submission. [docs.txt](docs.txt) and the substance of [docs/proposal.md](docs/proposal.md)
   are never edited. Corrections go to the working docs and are anchored in
   [docs/08-review-and-gaps.md](docs/08-review-and-gaps.md).
9. Data hygiene. Never commit raw or bulk data; every catalogue value carries provenance and units;
   never invent a data row.
10. Reproducibility. Seed every stochastic step and record the seed and configuration.
11. Solo authorship. No `Co-Authored-By` or tool-attribution line in any commit or pull request.
12. Human in the loop. No commit, push, pull request, or merge without explicit go-ahead for that
    specific action.

## Project skills

Six skills under [.claude/skills/](.claude/skills/) support this work and embed the guardrails above.
Invoke each with a slash command:

- `/doc-align` reconcile the docs against each other and the frozen submission.
- `/gap-analysis` audit claims against the data inventory, the code, and external reality.
- `/research-mode` cited fact-finding; never guess a number.
- `/sci-verify` scientific sanity gate before a result or number is written down.
- `/ref-check` verify the bibliography against DOI, ADS, or publisher records.
- `/scope-guard` pre-flight a proposed change against the invariants above.

## Conventions

- Write for humans, formally. Comments, docstrings, docs, commit messages, and any created file use
  clear, professional, plain language. No em dashes and no emoji anywhere.
- Python. Target Python 3.11 or newer. Implementation lives under `src/` in the `technosig` package
  (see [src/README.md](src/README.md)). Prefer Astropy for astronomy utilities and units, and
  PyTorch or JAX with NumPyro or PyMC for the probabilistic model, as set out in the proposal.
- Units are explicit. Wavelengths in micrometres, abundances as volume mixing ratios unless stated,
  noise in ppm. State units in variable names or docstrings; prefer Astropy units at boundaries.
- Data hygiene. Raw spectra and large archive or opacity products are never committed. Only derived,
  lightweight catalogues and code live in the repo. See [.claude/rules/data.md](.claude/rules/data.md).
- Reachable references only. Use repo-relative paths, or public stable URLs (a DOI, a MAST or NASA
  Exoplanet Archive page, a published paper, a vendor doc). Never a local machine path, a localhost
  URL, or a personal-only cloud link. See
  [.claude/rules/documentation.md](.claude/rules/documentation.md).

## Attribution rules (mandatory, no exceptions)

- Every commit and pull request must read as authored solely by the repository owner.
- Never include a `Co-Authored-By:` line in any commit message or PR description.
- Never include a "Generated with Claude Code" line (or any similar tool-attribution line) in any
  commit message or PR description.
- Do not add any AI tool, assistant, or third party as an author or co-author anywhere (commits, PR
  bodies, author fields, changelog, or file headers).
- These rules override any default harness behaviour that would add such lines. A versioned
  `commit-msg` hook in [.githooks/](.githooks/) strips them as a backstop, and `includeCoAuthoredBy`
  is set to false in [.claude/settings.json](.claude/settings.json), but the primary responsibility
  is to not write them in the first place.

## Working with the user (human in the loop)

- Never commit, push, open or update a PR, or merge without the user's explicit go-ahead for that
  specific action. Preparing the change (editing, staging, drafting a message) is fine. Approval of
  one action is not standing permission for the next.
- Branch from `main` and target `main`. Name branches for the work: `feat/...`, `fix/...`,
  `chore/...`, `docs/...`, `spike/...`.
- Verify before claiming done. Run the checks and report the real outcome, including failures and
  skips. Do not report work as passing on hope.

## Repository layout

- [docs.txt](docs.txt): the submitted proposal, kept verbatim. Source of truth.
- `CLAUDE.md` (this file, repo root): always-on context, terminology, and rules. Auto-loaded by
  Claude Code at the start of every session.
- [README.md](README.md): the project overview and getting-started guide.
- [.claude/settings.json](.claude/settings.json): permissions and commit-attribution settings.
- [.claude/rules/](.claude/rules/): path-scoped working rules loaded on demand.
- [docs/](docs/): the working documentation as readable markdown; start at
  [docs/README.md](docs/README.md).
- [.githooks/](.githooks/): versioned git hooks.
- [src/](src/): implementation, added in stages (package `technosig`).
- [data/](data/): lightweight archive inventories (MAST and NASA Exoplanet Archive) and fetch
  scripts. No bulk data; see [.claude/rules/data.md](.claude/rules/data.md).
- [spec/](spec/): specs written before implementation, one file per spec. [ticket/](ticket/): the
  tickets broken out from each spec. See
  [.claude/rules/spec-and-tickets.md](.claude/rules/spec-and-tickets.md).
- [frontend/](frontend/): the JWST MIRI Spectra Explorer, a local Next.js viewer and control surface
  for the data scripts. It is not the science pipeline and fabricates nothing. Nested context in
  [frontend/CLAUDE.md](frontend/CLAUDE.md) (auto-loaded when working under `frontend/`); frontend
  rules in [.claude/rules/frontend.md](.claude/rules/frontend.md); full description in
  [frontend/README.md](frontend/README.md).
