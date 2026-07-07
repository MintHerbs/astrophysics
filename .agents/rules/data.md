---
name: data-handling
description: Rules for data handling, archive access, hygiene, and provenance.
paths:
  - "src/technosig/data/**"
  - "data/**"
  - "**/*catalogue*"
  - "**/*catalog*"
  - "**/*.csv"
---

# Data handling (archive access, hygiene, and provenance)

> Applies to the data stage and to any catalogue file. Background:
> [docs/04-data-sources.md](../../docs/04-data-sources.md). Reachability rule:
> [documentation.md](documentation.md).

The project uses two distinct data streams:

1. Real archival JWST transmission spectra from the Mikulski Archive for Space Telescopes (MAST) and
   the NASA Exoplanet Archive. The MIRI subset is the scientifically meaningful sample; near-infrared
   spectra are demonstration and null-control data.
2. Synthetic training spectra, forward-modelled with known abundances, because no labelled real
   dataset exists.

## Never commit raw or bulk data

Raw spectra, downloaded archive products, opacity tables, cross-section databases, synthetic
training sets, and model checkpoints are never committed. They are large, often redistributable only
under their source's terms, and regenerable from code plus a query. The `.gitignore` blocks the
common formats (`.fits`, `.h5`, `.npy`, `data/raw/`, `data/synthetic/`, `models/`, and so on).

Only derived, lightweight, human-inspectable artefacts belong in version control: small curated
catalogues (a CSV of targets and their metadata), configuration, and code. If a small curated
catalogue must be tracked, add it explicitly with `git add -f` and keep it small.

## Archive query practice

- Record the exact query and the inclusion criteria (instrument mode, wavelength coverage,
  signal-to-noise threshold) alongside any catalogue it produces, so the sample is reproducible.
- Prefer programmatic access (for example astroquery for MAST, or the TAP service for the NASA
  Exoplanet Archive) over manual downloads, and cache raw products under an ignored `data/` path,
  never in the repo.
- Treat data availability as a gating risk. Do not assume a given spectrum or mode exists in the
  archive; verify it before building against it.
- MAST query gotchas encountered during the build are worth recording in
  [docs/04-data-sources.md](../../docs/04-data-sources.md) so they are not rediscovered.

## Provenance and units

Every value in a catalogue carries where it came from (target name, proposal ID, instrument, and the
archive it was pulled from) and its units. Wavelengths in micrometres, noise in ppm, abundances as
volume mixing ratios unless stated otherwise. State units in column names or an accompanying schema.
