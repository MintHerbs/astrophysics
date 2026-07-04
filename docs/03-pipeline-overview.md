# 03. Pipeline overview

> The methodology of [02-methodology.md](02-methodology.md) expressed as engineering stages, mapped
> to the intended `src/` layout in [../src/README.md](../src/README.md).

The pipeline runs end to end in six stages. Data flows one way; each stage has a clear input and
output so it can be built and tested on its own.

```
   Real archive (MAST, NASA Exoplanet Archive)                 Known abundances (a grid)
                     |                                                    |
                     v                                                    v
             [1] DATA                                          [2] FORWARD MODEL
     query + inclusion criteria                       petitRADTRANS + HITRAN2020 target gases
     -> curated target catalogue                      + confounders -> clean synthetic spectra
     -> loaded real spectra                                            |
                     |                                                  v
                     |                                          [3] NOISE
                     |                                  PandExo instrument noise + correlated/
                     |                                  systematic augmentation (10 and 50 ppm)
                     |                                  -> labelled noisy training spectra
                     |                                                  |
                     |                    +-----------------------------+
                     |                    |
                     v                    v
                  [4] INFERENCE (hybrid, noise-aware)
        classical nested sampling (baseline)  +  amortised NPE (scalable)
        -> abundance posterior per planet and gas
                     |
                     v
              [5] VALIDATION  ->  [6] CATALOGUE
   injection/recovery, calibration,      per-planet upper credible bounds,
   cross-method agreement, Earth          the upper-limit catalogue,
   benchmark recovery                     the open-source pipeline release
```

## Stage 1: Data

Query MAST and the NASA Exoplanet Archive under explicit inclusion criteria (instrument mode,
wavelength coverage, signal-to-noise). Produce a small curated target catalogue and load the real
spectra. The MIRI subset is the scientific sample; near-infrared spectra are demonstration and
null-control data. Detail in [04-data-sources.md](04-data-sources.md). Module: `technosig/data`.

## Stage 2: Forward model

Generate clean, noiseless synthetic spectra with petitRADTRANS for a grid of known abundances. Add
the four target gases as custom opacity species from HITRAN2020, plus the confounders. This produces
the label-to-spectrum mapping that supervised training needs. Module: `technosig/forward`.

## Stage 3: Noise

Inject realistic instrument noise with PandExo, scaled to host-star brightness and transit count,
then augment with correlated and systematic noise under a 10 ppm and a 50 ppm floor. The output is
labelled noisy training spectra. The noise is there to teach the model how much uncertainty to
report, not to be removed. Module: `technosig/noise`.

## Stage 4: Inference

Map a noisy spectrum to an abundance posterior per gas. Two methods that must agree: a classical
nested-sampling retrieval (the trustworthy baseline) and an amortised NPE model (the scalable
artefact). Module: `technosig/inference`.

## Stage 5: Validation

Confirm the posteriors are trustworthy: injection-and-recovery on held-out synthetic spectra,
posterior calibration (coverage), cross-method agreement, and, most importantly, recovery of Earth's
known CFC content from a real benchmark spectrum. A near-infrared input must return a non-informative
limit. Module: `technosig/validation`.

## Stage 6: Catalogue

Assemble the per-planet, per-gas upper credible bounds into the upper-limit catalogue, and package
the pipeline for open-source release. Module: `technosig/catalogue`.

## Build order

Data first: the critical path is real archival data and its inclusion criteria. A prior
implementation of the archive query and catalogue build exists in the git history and is the starting
point. See [07-roadmap.md](07-roadmap.md).
