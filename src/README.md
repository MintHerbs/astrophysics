# Source code

Implementation lives here, under the `technosig` package, and is added in stages as each part of the
pipeline is built. The layout mirrors the six pipeline stages described in
[../docs/03-pipeline-overview.md](../docs/03-pipeline-overview.md).

Nothing here is load-bearing yet: `technosig/__init__.py` is a placeholder so the package exists.

## Intended module layout

```
src/
  technosig/
    __init__.py
    data/         Archive access: MAST and NASA Exoplanet Archive queries,
                  inclusion criteria, catalogue assembly, spectrum loading.
    forward/      Forward modelling with petitRADTRANS: target-gas opacities from
                  HITRAN2020, plus confounders (methane, ammonia, hydrogen
                  sulphide, clouds, temperature structure).
    noise/        PandExo instrument-noise injection, plus augmentation for
                  correlated and systematic noise; 10 ppm and 50 ppm floors.
    inference/    The hybrid inference core: a classical nested-sampling retrieval
                  baseline and an amortised neural posterior estimation (NPE) model.
    validation/   Injection-and-recovery, posterior calibration (coverage),
                  cross-method agreement, and the Earth benchmark recovery.
    catalogue/    Per-planet upper-limit assembly and reporting.
```

## Build order

Data first. The critical path is real archival data and its inclusion criteria, so the `data` stage
is re-established before the model stages. See the roadmap in
[../docs/07-roadmap.md](../docs/07-roadmap.md).

A prior implementation of the archive query and catalogue build (JWST near-infrared subset) exists
in the git history and is the starting point for the `data` module.
