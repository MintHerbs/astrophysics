# 01. Aims and objectives

> The high-level purpose, scope, and framing. For the full submitted text see
> [proposal.md](proposal.md); the verbatim original is [../docs.txt](../docs.txt).

## The one-line aim

Search the real JWST exoplanet transmission-spectroscopy archive for industrial technosignature gases
and selected gaseous biosignatures, and produce the first empirical, quantitative upper limits on
their atmospheric abundances, using a reproducible machine-learning pipeline.

## Why upper limits, not detections

An actual detection with the present archive is extremely unlikely. Most of the archive is hot gas
giants and sub-Neptunes with no plausible industrial reservoir. The industrial-pollution question is
astrobiologically meaningful only for cool, potentially habitable worlds, of which the present MIRI
transmission archive holds very few (see the sample-reality note below). Even for the most favourable
target, the expected signal is so small that detecting present-day-Earth-level concentrations would
require observing essentially every available transit under optimistic noise assumptions
(Haqq-Misra et al., 2022).

The response is to reframe the deliverable. The result is an upper limit: "the abundance of gas X on
planet Y is below a given value at 95 percent credibility". A non-detection is then a result in its
own right, namely the first systematic empirical ceiling on industrial pollution across real
exoplanets. This mirrors the accepted template for nitrogen-dioxide pollution (Kopparapu et al.,
2021) and CFC detectability (Haqq-Misra et al., 2022), and it is publishable regardless of outcome.

## Sample reality (what the MIRI archive actually contains)

The framing above once pointed to "rocky, potentially habitable worlds such as the TRAPPIST-1
planets". The real MIRI transmission archive does not support that framing, and this is stated plainly
so the science is not oversold (evidence and sources in [08-review-and-gaps.md](08-review-and-gaps.md) C1):

- TRAPPIST-1 has no MIRI transmission spectra. Its JWST MIRI data is broadband photometry in
  secondary eclipse (thermal emission at 12.8 and 15 micrometres), which a transmission pipeline
  cannot use. It is a motivating and future case (for example for Ariel), not a current target.
- In the project's own inventory, the rocky targets present (55 Cancri e, GJ 1132 b, LHS 3844 b,
  LHS 1478 b) are hot, not habitable-zone; the only temperate targets are sub-Neptunes (K2-18 b,
  GJ 1214 b).
- The upper-limit exercise stays valid on every target, but its astrobiological weight is small where
  the target is hot or gas-rich. This is a further reason the deliverable is a defensible ceiling, not
  a detection.

## The gap this fills

1. There is no empirical upper-limit catalogue derived from real archival spectra. Existing
   assessments rest on simulated data.
2. There is no reusable machine-learning pipeline capable of producing such limits at scale, across
   both industrial and biological gases, applied to the real archive.

## Objectives

General objective: develop and validate a reproducible machine-learning pipeline that searches the
JWST transmission-spectroscopy archive for industrial technosignature gases and selected gaseous
biosignatures, and produces the first empirical, quantitative upper limits on their atmospheric
abundances.

| # | Objective | Maps to pipeline stage |
| --- | --- | --- |
| 1 | Build a large set of labelled synthetic training spectra by forward-modelling atmospheres with known abundances and realistic JWST noise. | Forward model, Noise (see [03-pipeline-overview.md](03-pipeline-overview.md)) |
| 2 | Develop and calibrate a noise-aware Bayesian model that turns a noisy spectrum into an abundance posterior per gas, validated against a classical retrieval and a real benchmark. | Inference, Validation |
| 3 | Apply the validated pipeline to the real JWST archive (MIRI subset) to derive per-planet upper limits, and release it as open-source. | Data, Catalogue |
| Secondary | Extend the pipeline to biosignature gases in the same MIRI window (ozone with methane as a disequilibrium pair; DMS, DMDS, methyl chloride), reported as cautious upper limits. | All stages, biosignature extension |

## Expected output

- The first empirical upper-limit catalogue on CFC-11, CFC-12, SF6, and NF3 across the analysed JWST
  sample, plus upper limits on the biosignature gases and an assessment of the ozone and methane
  disequilibrium pair.
- A reusable, open-source spectral-unmixing pipeline that transfers to future archives such as Ariel.
- A peer-reviewed publication whose value does not depend on a detection.
- A demonstration that the pipeline returns non-informative limits on near-infrared data, where no
  strong target band exists, as evidence the method behaves correctly.
