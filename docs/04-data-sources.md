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
spectra contain no strong target band, which makes them a null control: the pipeline should return
non-informative limits there, and doing so is evidence it behaves correctly.

### Wavelength coverage caveats

Two practical points about the target band, recorded so they are not rediscovered (see
[08-review-and-gaps.md](08-review-and-gaps.md) S4 and C4):

- Do not filter on the archive coverage metadata. MAST records MIRI LRS coverage as 5 to 10
  micrometres in the CAOM `em_min` and `em_max` fields (which is what the inventory's
  `wavelength_min_um` and `wavelength_max_um` columns carry), and this understates the true range.
  MIRI LRS with the P750L disperser covers 5 to 12 micrometres, and the reduced spectra in the NASA
  inventory reach about 11.8 micrometres and beyond. Key the wavelength inclusion criterion off the
  instrument mode (P750L), not `em_max`, or the whole sample is wrongly excluded and the CFC-11 band
  near 11.8 micrometres is lost.
- Expect uneven sensitivity across the band. MIRI LRS throughput and flux calibration degrade toward
  the red end, so the bands near 10.5 to 11.8 micrometres (SF6, CFC-12, NF3, and CFC-11) are observed
  with lower sensitivity than the 9 to 10 micrometre region (NF3 at 9.7, ozone at 9.6, CFC-11 at 9.2).
  Expect the tightest limits near 9 to 10 micrometres and the weakest at the red edge.

Access practice: prefer programmatic access (for example astroquery for MAST, or the TAP service for
the NASA Exoplanet Archive) so the sample is reproducible. Record the exact query and inclusion criteria with any
catalogue produced. Cache raw products under an ignored local `data/` path. Raw spectra are never
committed (see below). Note that the archives often list several published reductions of a single
transit (different pipelines, for example WASP-39 b); these are not independent transits, and
combining spectra must distinguish the two cases (see [02-methodology.md](02-methodology.md) and
[08-review-and-gaps.md](08-review-and-gaps.md) S5).

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
