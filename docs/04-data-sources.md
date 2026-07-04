# 04. Data sources

> The two data streams and how they are handled. The always-on hygiene rules are in
> [../.claude/rules/data.md](../.claude/rules/data.md).

The project uses two distinct data streams. One is real and archival, the other synthetic and
generated.

## Stream 1: real archival spectra (the sample)

Published JWST transmission spectra, drawn from two public archives:

- Mikulski Archive for Space Telescopes (MAST), the primary JWST data archive.
  <https://archive.stsci.edu/>
- NASA Exoplanet Archive, for planet and host-star parameters and cross-referencing.
  <https://exoplanetarchive.ipac.caltech.edu/>

Inclusion criteria (a spectrum is admitted only if it passes all):

- Instrument mode: the MIRI subset is the scientifically meaningful sample. Near-infrared modes are
  admitted only as demonstration and null-control data.
- Wavelength coverage: overlaps the target band, roughly 8.6 to 11.8 micrometres for the
  technosignature gases and near 9.6 micrometres for ozone.
- Signal-to-noise ratio: above a stated threshold, recorded with the catalogue.

Why the split: the target gas features are mid-infrared, reachable only by MIRI. Near-infrared
spectra cannot physically contain the target signal, which makes them a null control: the pipeline
should return non-informative limits there, and doing so is evidence it behaves correctly.

Access practice: prefer programmatic access (for example astroquery for MAST, or the TAP service for
the NASA Exoplanet Archive) so the sample is reproducible. Record the exact query and inclusion criteria with any
catalogue produced. Cache raw products under an ignored local `data/` path. Raw spectra are never
committed (see below).

## Stream 2: synthetic training spectra (the labels)

Generated, not downloaded, because no labelled real dataset exists. The forward model sets a known
abundance and computes the spectrum it produces, giving the labelled pairs supervised training needs.

Tools and databases:

- petitRADTRANS: the radiative-transfer forward model.
  <https://petitradtrans.readthedocs.io/>
- HITRAN2020: molecular cross-sections for the target gases and confounders (Gordon et al., 2022).
  <https://hitran.org/>
- PandExo: JWST and HST instrument-noise simulation (Batalha et al., 2017).
  <https://natashabatalha.github.io/PandExo/>

These opacity tables and cross-section databases are large and fetched separately; they are not
committed.

## Benchmark

Earth-as-a-transiting-exoplanet spectrum (Lustig-Yaeger et al., 2023). A real, out-of-distribution
benchmark with known CFC content, used to validate that the pipeline recovers a true signal.

## Data hygiene (summary)

- Never commit raw spectra, downloaded archive products, opacity tables, synthetic training sets, or
  model checkpoints. The `.gitignore` blocks the common formats and paths.
- Only derived, lightweight, human-inspectable artefacts belong in version control: small curated
  catalogues, configuration, and code.
- If a small curated catalogue must be tracked, add it explicitly with `git add -f` and keep it
  small.
- Every catalogue value carries its provenance (target, proposal ID, instrument, source archive) and
  units.

## MAST query notes

Practical gotchas found while querying the archive belong here, so they are recorded once and not
rediscovered. (To be filled in as the data stage is re-established. A prior archive-query and
catalogue-build implementation for the near-infrared subset exists in the git history and is the
starting point.)
