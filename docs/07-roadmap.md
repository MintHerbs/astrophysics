# 07. Roadmap and task list

> Work items grouped by the pipeline stages in [03-pipeline-overview.md](03-pipeline-overview.md) and
> the objectives in [01-aims-and-objectives.md](01-aims-and-objectives.md). This is a living list,
> updated as the project moves. Status keys: TODO, in progress, done.

## Guiding order

Data first. The critical path is real archival data and its inclusion criteria, so the data stage is
re-established before the model stages. A prior archive-query and catalogue-build implementation for
the near-infrared subset exists in the git history and is the starting point.

## Phase 0: foundations (current)

- [x] Reset the repository to a clean research structure built from the submitted proposal.
- [x] Capture project context, terminology, and rules in `.claude/`.
- [x] Write the working documentation set in `docs/`.
- [x] Add the review record ([08-review-and-gaps.md](08-review-and-gaps.md)), six project skills, and
      layered guardrails (invariants, rules, and hooks).
- [ ] Pin the environment: choose Python version, add `requirements.txt` or `pyproject.toml`, set up
      linting, formatting, type checking, and testing.

## Phase 1: data stage (Objective 3, prerequisite)

- [ ] Reintroduce the MAST and NASA Exoplanet Archive query under `src/technosig/data`, restoring the
      prior near-infrared implementation from git history as a base.
- [ ] Encode the inclusion criteria (instrument mode, wavelength coverage, signal-to-noise) as code,
      and record the exact query with each catalogue.
- [ ] Produce a curated target catalogue: the MIRI scientific sample plus the near-infrared
      null-control set.
- [ ] Key the wavelength inclusion criterion off the instrument mode (P750L, 5 to 12 micrometres),
      not the CAOM `em_max` field, which understates coverage ([08-review-and-gaps.md](08-review-and-gaps.md) S4).
- [ ] Produce a cool and temperate target shortlist for the technosignature search, excluding hot
      planets where the target-gas cross-sections are invalid ([08-review-and-gaps.md](08-review-and-gaps.md) C2).
- [ ] Build a spectrum loader that caches raw products under an ignored `data/` path.
- [ ] Record MAST query gotchas in [04-data-sources.md](04-data-sources.md).

## Phase 2: forward model (Objective 1)

- [ ] Wire petitRADTRANS to produce clean spectra over an abundance grid.
- [ ] Add CFC-11, CFC-12, SF6 (cross-sections) and NF3 (line list) as custom opacity species from
      HITRAN2020, confirm their temperature validity, and restrict the technosignature grid to cool
      and temperate targets ([08-review-and-gaps.md](08-review-and-gaps.md) C2, M2).
- [ ] Add the confounders (methane, ammonia, hydrogen sulphide, clouds, temperature structure).
- [ ] Add the ozone, DMS, DMDS, and methyl chloride species for the biosignature extension.

## Phase 3: noise (Objective 1)

- [ ] Inject PandExo instrument noise scaled to host-star brightness and transit count.
- [ ] Add correlated and systematic noise augmentation under the 10 ppm and 50 ppm floors.
- [ ] Assemble the labelled noisy training set, with seeds and configuration recorded.

## Phase 4: inference (Objective 2)

- [ ] Build the classical nested-sampling retrieval baseline (dynesty, MultiNest, or UltraNest).
- [ ] Build the amortised NPE model that maps a spectrum to an abundance posterior.
- [ ] Establish the noise-aware, single-model design (no denoiser-then-detector chain).

## Phase 5: validation (Objective 2)

- [ ] Injection-and-recovery on held-out synthetic spectra.
- [ ] Posterior calibration (coverage) tests.
- [ ] Cross-method agreement between the classical and NPE results.
- [ ] Recover CFC-11 and CFC-12 from the Lustig-Yaeger et al. (2023) benchmark in the noiseless limit
      (a forward-model fidelity test, not a JWST-noise sensitivity test; [08-review-and-gaps.md](08-review-and-gaps.md) C3).
- [ ] Confirm near-infrared inputs return non-informative limits (the null-control check).
- [ ] Assess per-band sensitivity across the MIRI LRS range; expect weaker limits at the red end
      ([08-review-and-gaps.md](08-review-and-gaps.md) C4).
- [ ] Distinguish co-adding genuine repeat transits from choosing among pipeline reductions of one
      transit ([08-review-and-gaps.md](08-review-and-gaps.md) S5).

## Phase 6: catalogue and release (Objective 3 and secondary)

- [ ] Average multiple transits per planet before inference.
- [ ] Derive per-planet, per-gas upper credible bounds and assemble the upper-limit catalogue.
- [ ] Assess the ozone and methane disequilibrium pair.
- [ ] Package and release the pipeline as open-source.
- [ ] Draft the publication, framed around the upper-limit result.
