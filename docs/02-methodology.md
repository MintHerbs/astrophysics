# 02. Methodology

> How the study works, from research design to validation. The pipeline as engineering stages is in
> [03-pipeline-overview.md](03-pipeline-overview.md); the data streams in
> [04-data-sources.md](04-data-sources.md).

## Research design

Computational, archive-only, and simulation-trained. No new observations or telescope time. The
paradigm is supervised Bayesian inference for spectral unmixing: train a model on simulated spectra
whose true gas abundances are known, then apply it to real archival spectra to infer each gas's
abundance with its uncertainty.

Why simulation-trained: no labelled real dataset exists, because nobody has ever measured the true
gas abundance of an exoplanet atmosphere. Labelled spectrum-and-abundance pairs can only be produced
by setting an abundance and forward-modelling the spectrum it produces. This is standard across the
field.

## Training-data generation

1. Clean spectra. Produce noiseless spectra with the petitRADTRANS radiative-transfer model.
2. Target gases. Add CFC-11, CFC-12, SF6, and NF3 as custom opacity species using HITRAN2020
   cross-sections.
3. Confounders. Include methane, ammonia, hydrogen sulphide, clouds, and temperature structure,
   whose absorption overlaps the target bands, so the model learns to separate them.
4. Instrument noise. Inject realistic random noise with PandExo, scaled to host-star brightness and
   transit count.
5. Systematics. Augment with the correlated and systematic noise PandExo does not fully capture,
   under two floors: an optimistic 10 ppm and a conservative 50 ppm.

Key principle: the purpose of injecting noise is not to teach the model to remove it, but to teach
the model to recognise how much noise is present and widen its uncertainty accordingly.

## Inference model

An upper limit is a tail quantile of a probability distribution, so the model must be probabilistic.
A single-value regressor cannot express the result. The design is hybrid:

- Classical nested-sampling retrieval (dynesty, MultiNest, or UltraNest). A rigorous baseline with no
  simulation-to-real training gap. It produces the trustworthy headline limits, and it is feasible
  because the meaningful sample is small.
- Amortised machine-learning model. Neural posterior estimation (NPE) maps each noisy spectrum
  directly to an abundance posterior. This is the methodological novelty and the scalable, reusable
  artefact. NPE is preferred over Monte Carlo dropout, which is least reliable precisely in the
  distribution tail where the result lives.

A single noise-aware model maps spectrum to posterior directly. It is not a denoiser-then-detector
chain, which would erase sub-noise signal and discard uncertainty.

## Biosignature extension

The same forward-model, noise-injection, and inference chain is applied to biosignature gases in the
MIRI window: principally ozone near 9.6 micrometres, plus DMS, DMDS, and methyl chloride. Methane is
already a confounder, so the ozone and methane disequilibrium pair can be evaluated at no extra
modelling cost. Each biosignature result is an upper credible bound unless the detection threshold is
met.

## Validation and analysis

The limits are validated by:

- Injection-and-recovery on held-out synthetic spectra.
- Posterior calibration (coverage) tests.
- Agreement between the machine-learning and classical methods.
- Recovery of Earth's known CFC content from a real out-of-distribution benchmark spectrum
  (Lustig-Yaeger et al., 2023), which the proposal singles out as the most important check.

Analysis rules:

- Where a planet has multiple observed transits, average them before inference to improve the
  signal-to-noise ratio.
- For each planet and gas, report the upper credible bound of the posterior as the upper limit.
- Claim a positive detection only for a feature exceeding three standard deviations across multiple
  independent spectral channels that cannot be explained by any modelled confounder. Anything short
  of this is a null result with an upper limit.

## Implementation stack

Python, with PyTorch or JAX for the model, NumPyro or PyMC for probabilistic modelling, and Astropy
for astronomy utilities (Astropy Collaboration, 2022). Forward modelling with petitRADTRANS,
cross-sections from HITRAN2020, instrument noise with PandExo. See
[06-references.md](06-references.md) for the tool citations and
[04-data-sources.md](04-data-sources.md) for the data tooling.
