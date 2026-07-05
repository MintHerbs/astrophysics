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
   cross-sections and line lists (CFC-11, CFC-12, and SF6 are absorption-cross-section species; NF3
   is line-by-line). These cross-sections are laboratory measurements valid only near terrestrial
   temperatures (roughly 190 to 300 K), so the technosignature retrieval is applied only to cool and
   temperate targets. See [08-review-and-gaps.md](08-review-and-gaps.md) C2 and M2.
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
  simulation-to-real training gap, although it shares the forward-model gap (the same petitRADTRANS
  physics and the same temperature-limited cross-sections). It produces the trustworthy headline
  limits, and it is feasible because the meaningful sample is small.
- Amortised machine-learning model. Neural posterior estimation (NPE) maps each noisy spectrum
  directly to an abundance posterior. This is the methodological novelty and the scalable, reusable
  artefact. NPE is preferred over Monte Carlo dropout, which is least reliable precisely in the
  distribution tail where the result lives. Being trained on synthetic spectra, NPE inherits the
  simulation-to-real gap that nested sampling avoids; this risk is controlled by the cross-check
  against the classical retrieval and by simulation-based-inference coverage diagnostics (coverage
  tests, simulation-based calibration, or TARP). See [08-review-and-gaps.md](08-review-and-gaps.md) S3.

A single noise-aware model maps spectrum to posterior directly. It is not a denoiser-then-detector
chain, which would erase sub-noise signal and discard uncertainty.

## Biosignature extension

The same forward-model, noise-injection, and inference chain is applied to biosignature gases in the
MIRI window: principally ozone near 9.6 micrometres, plus DMS, DMDS, and methyl chloride. Methane is
already a confounder, so the ozone and methane disequilibrium pair can be evaluated at no extra
modelling cost. Each biosignature result is an upper credible bound unless the detection threshold is
met.

## Validation and analysis

Validation establishes three distinct claims, which must not be conflated (see
[08-review-and-gaps.md](08-review-and-gaps.md) C3):

- Calibration. Posterior coverage tests confirm a stated credible interval contains the truth the
  claimed fraction of the time.
- Sensitivity. Injection-and-recovery on held-out synthetic spectra, at both the 10 ppm and 50 ppm
  noise floors, establishes what abundance the pipeline can bound at realistic JWST noise.
- Forward-model fidelity. Recovery of CFC-11 and CFC-12 from Earth's real, out-of-distribution
  transmission spectrum (Lustig-Yaeger et al., 2023). This recovery holds in the noiseless limit of
  that high-signal-to-noise empirical spectrum: it tests the forward model and the spectral unmixing
  on real overlapping features, and is not a demonstration of sensitivity at JWST noise levels
  (Earth's real CFCs, at hundreds of parts per trillion, are undetectable under realistic noise).

The machine-learning and classical posteriors must also agree within their stated uncertainties, and
a near-infrared input must return a non-informative limit (the null control).

Analysis rules:

- Combine spectra with care, distinguishing two cases. Genuine repeat transits of one planet are
  co-added (signal-to-noise-weighted) before inference. Multiple published pipeline reductions of the
  same transit (common in the archive, for example WASP-39 b) are not independent transits; choose a
  reference reduction or model across them, and record the choice. See
  [08-review-and-gaps.md](08-review-and-gaps.md) S5.
- For each planet and gas, report the upper credible bound of the posterior (for example the 95
  percent bound) as the upper limit.
- Claim a positive detection only for a feature exceeding five standard deviations across multiple
  independent spectral channels that cannot be explained by any modelled confounder; between three
  and five standard deviations is reported as tentative, not detected. Anything short of this is a
  null result with an upper limit. See [08-review-and-gaps.md](08-review-and-gaps.md) S2.

## Implementation stack

Python, with PyTorch or JAX for the model, NumPyro or PyMC for probabilistic modelling, and Astropy
for astronomy utilities (Astropy Collaboration, 2022). Forward modelling with petitRADTRANS,
cross-sections from HITRAN2020, instrument noise with PandExo. See
[06-references.md](06-references.md) for the tool citations and
[04-data-sources.md](04-data-sources.md) for the data tooling.
