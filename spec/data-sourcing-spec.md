# Data sourcing: real MIRI inventory and synthetic forward-model tooling

> Captures the findings from the 2026-07-14 data-sourcing review: the real-data search-index
> strategy, the verified size of the usable MIRI sample, and the forward-model tooling checks for
> petitRADTRANS and PandExo. Feeds corrections into [docs/04-data-sources.md](../docs/04-data-sources.md),
> [docs/08-review-and-gaps.md](../docs/08-review-and-gaps.md), and [data/README.md](../data/README.md).
> No tickets have been broken out yet; this is the planning record.

## Problem

Two questions needed a verified, not assumed, answer before the data stage and the forward model are
built:

1. How much real, usable MIRI transmission data actually exists, given the plan to use the NASA
   Exoplanet Archive as a search index into MAST, restricted to MIRI only?
2. Do the chosen forward-model tools (petitRADTRANS for the spectrum, PandExo for the noise) actually
   support the four technosignature gases and the real instrument mode, or does the plan have an
   unstated gap?

A third question came up alongside these: the project's methodology already states that training uses
only synthetic data and that validation is three distinct claims (see
[docs/02-methodology.md](../docs/02-methodology.md) "Validation and analysis" and
[docs/08-review-and-gaps.md](../docs/08-review-and-gaps.md) C3). A proposed architecture-diagram
description of "synthetic for training, real for validation" was checked against this and against the
literature; no diagram file exists anywhere in the repository, so there was nothing to reconcile in the
docs themselves, but the literature check is recorded below because it grounds the existing framing.

## Real-data search-index strategy: NASA Exoplanet Archive into MAST

The approach: use the NASA Exoplanet Archive's `spectra` table, filtered to
`instrument LIKE '%MIRI%' AND spec_type = 'Transmission'`, as the index of which planets have a
published MIRI transmission spectrum, then cross-reference each planet's host-star name against
[data/MAST/mast_miri_inventory.csv](../data/MAST/mast_miri_inventory.csv) to find the corresponding
raw MIRI/SLITLESS P750L observation to retrieve.

**Verified: the strategy works.** All 9 planets in the NASA archive's MIRI-transmission table (GJ
1214 b, K2-18 b, K2-22 b, L 168-9 b, LTT 3780 c, WASP-107 b, WASP-17 b, WASP-39 b, WASP-43 b) have a
matching MIRI/SLITLESS P750L entry in the MAST inventory, matched by host-star name (accounting for
naming variants, for example NASA archive "K2-22 b" versus MAST target name "K2-22B").

## Verified: the usable real sample is 9 planets, 9 independent transits

The raw counts overstate the usable sample. The NASA archive's 24 rows and MAST's 15 matched
observation rows both include repeat pipeline reductions and non-science companion exposures. Cross-
referencing MAST proposal and visit structure against each NASA archive row, using primary sources
(the JWST proposal APT exports from STScI's Program Information system, and the actual downloaded
spectrum data already cached under `data/NASA_Archive/raw/`), gives:

| Planet | NASA archive rows | MAST proposal | Independent transits | Basis |
| --- | --- | --- | --- | --- |
| GJ 1214 b | 1 | 1803 (Bean) | 1 | Single MAST visit. |
| K2-18 b | 2 | 2722 (Madhusudhan) | 1 | Obs 2 (21068 s) is the transit; Obs 4 (124 s) is a dedicated background exposure, confirmed from the proposal's own APT export ("Offset 20.0 arcsec, 30.0 arcsec", sequenced non-interruptibly with Obs 2). |
| K2-22 b | 2 | 3315 (Wright) | 1 published (3 MAST visits exist; see residual finding below) | Three separate MAST visits on three different calendar dates (2024-04-24, -26, -27); only one reduction (Tusay et al., 2025, shown as binned and unbinned) is published. |
| L 168-9 b | 4 | 1033 (Kendrew) | 1 | Single MAST visit, independently reduced by two papers (Bouwman et al., 2023; Alam et al., 2025). |
| LTT 3780 c | 2 | 3557 (Madhusudhan) | 1 | Obs 6 (12961 s) is the transit; Obs 13 (67 s) is a dedicated background exposure, confirmed from the same proposal's APT export ("Offset -35.0 arcsec, 30.0 arcsec", sequenced with Obs 6); the same proposal explicitly labels the identical pattern for its TOI-270 target ("Background Observation For: [MIRI (Obs 12)]"). |
| WASP-107 b | 4 | 1280 (Lagage) | 1 | Welbanks et al. (2024) did not obtain independent MIRI data; their paper states verbatim "we incorporate recently published JWST/MIRI LRS observations [Dyrek et al. 2024]" (arXiv:2405.11018). Their own new data was NIRCam only (GTO-1185/MANATEE, F322W2 and F444W, observed 2023-01-14 and 2023-07-04). |
| WASP-17 b | 2 | 1353 (Lewis) | 1 | Two MAST rows of identical duration (17858 s); a single visit split into exposure segments. |
| WASP-39 b | 3 | 2783 (Powell) | 1 | One MAST row (28576 s) is the transit; the 160 s row is a parallel MIRI *imaging* product, not LRS spectroscopy, confirmed by its product URI (`..._mirimage`, not `..._p750l-slitlessprism`) and calibration level 2 versus 3. Matches the "parallel imaging or background exposures" category already documented in [data/README.md](../data/README.md). |
| WASP-43 b | 4 | 1366 (Meech) | 1 | Single MAST visit, 4 pipeline reductions of it (Bell et al., 2024). |
| **Total** | **24** | | **9** | |

Roughly 70 percent of the NASA archive's 24 rows are repeat pipeline reductions of the same handful of
transits, not independent data. This is a quantified instance of
[docs/08-review-and-gaps.md](../docs/08-review-and-gaps.md) S5, which already states the general
principle; this review supplies the verified per-planet counts.

### Residual finding: K2-22 b may have unpublished real data

K2-22 b has three fully separate MAST visits under proposal 3315 (three different calendar dates), but
only one has a published NASA-archive reduction. The other two visits may hold usable real transit
data that the NASA-archive-as-index strategy would currently miss, because that strategy only surfaces
what has been published, not what has been observed. If the real sample size matters for a downstream
decision, this is worth a direct MAST pull and reduction rather than relying on the NASA archive alone
for this planet.

### Exclusion rule for non-science MAST rows

Two patterns, both confirmed against primary sources, exclude a MAST row from the transit count without
downloading the product:

1. **Background exposure.** A short exposure (order 100 seconds) immediately following the main
   transit exposure, same instrument mode (`p750l-slitlessprism`), same calibration level, sequenced
   with the main observation in the proposal's Special Requirements ("Sequence Observations N, M"),
   and carrying a nonzero pointing "Offset" in arcseconds. Confirmed for K2-18 b and LTT 3780 c
   directly from the STScI Program Information APT exports for proposals 2722 and 3557.
2. **Parallel imaging exposure.** A short exposure whose product URI ends `_mirimage` rather than
   `_p750l-slitlessprism`, at calibration level 2 rather than 3. Confirmed for WASP-39 b. This matches
   the category already documented in [data/README.md](../data/README.md) ("A small number of
   observations returned under the same instrument name instead carry an imaging filter").

## Forward-model tooling: petitRADTRANS and PandExo

Spelling, for the record: **petitRADTRANS** (not "petiteRADTRANS"), **PandExo** (not "pandaEXO", the
name is Pandeia + Exoplanets).

### PandExo: confirmed, matches the real-data instrument mode

PandExo (Batalha et al., 2017) explicitly supports MIRI LRS slitless mode with the P750L disperser,
the exact mode recorded in [data/MAST/mast_miri_inventory.csv](../data/MAST/mast_miri_inventory.csv)
for the real archival sample. Recent comparative work (Gen TSO versus PandExo) found agreement within
roughly 1 to 5 percent for MIRI/LRS P750L, independent confirmation the noise model is still current.

### petitRADTRANS: a real, previously unflagged implementation gap

None of CFC-11, CFC-12, SF6, or NF3 is in petitRADTRANS's built-in opacity database (checked directly
against the current species list). This was already anticipated in
[docs/02-methodology.md](../docs/02-methodology.md) ("Add ... as custom opacity species").

The gap: petitRADTRANS's documented custom-opacity routes are ExoMol tables (plug-and-play), DACE
cross-section grids, ExoCross-converted line lists, or a hand-written line list converted with
`format2petitradtrans()`. None of these four is a direct import path for HITRAN's own `.xsc`
cross-section format. CFC-11, CFC-12, and SF6 are HITRAN "cross-section" species precisely because
their spectra are too dense for line-by-line representation (confirmed against the HITRAN cross-section
definitions page), so the standard ExoMol- or ExoCross-based conversion path does not apply to them.
NF3, which does have a genuine HITRAN2020 line list, is the one target gas that likely fits the
documented ExoCross pathway directly.

petitRADTRANS does support a custom Python load function for arbitrary opacity tables, so the gas is
representable, but loading CFC-11, CFC-12, and SF6 needs a purpose-written
HITRAN-cross-section-to-petitRADTRANS converter, not an assumed by-product of "petitRADTRANS accepts
custom opacities."

No published precedent exists for this exact integration. The technosignature detectability papers
this project already cites for these gases, Seager et al. (2023) for NF3 and SF6, and
Schwieterman et al. (2024) for the broader artificial-greenhouse-gas set, both used the Planetary
Spectrum Generator (PSG), not petitRADTRANS. There is no "how we did it" trail to copy; this is new
integration work. Recorded as
[docs/08-review-and-gaps.md](../docs/08-review-and-gaps.md) S6.

## Background: training-on-synthetic, validating-on-real, and what the literature says

A proposed pipeline description said "synthetic data for training, real data for validation." No
architecture-diagram file recording this was found anywhere in the repository (checked the docs index,
`spec/`, `ticket/`, and every image or diagram file in the working tree), so there was nothing to
reconcile against; this section instead checks the phrase itself against the project's own methodology
and the wider literature, since the project's own docs already state something more precise.

[docs/02-methodology.md](../docs/02-methodology.md) ("Validation and analysis") and
[docs/08-review-and-gaps.md](../docs/08-review-and-gaps.md) C3 already establish that validation is
three distinct claims, not "check against real data": calibration (coverage tests on synthetic data
with known truth), sensitivity (synthetic injection-and-recovery at the 10 and 50 ppm floors), and
forward-model fidelity (the single Earth benchmark, in the noiseless limit only). Real archival
exoplanet spectra have no known ground truth, so they cannot function as a validation set in the
standard machine-learning sense; applying the trained model to them is Stage 4 (Inference), the
deployment step that produces the upper-limit catalogue, not Stage 5 (Validation).

The literature confirms this distinction cleanly:

- Vasist et al. (2023) train their neural posterior estimator entirely on synthetic petitRADTRANS
  spectra and validate with posterior-predictive checks and coverage diagnostics against synthetic
  ground truth, cross-checked against classical nested sampling (MultiNest); no real-spectrum test
  appears in that validation step. This is the same two-method cross-check design this project uses,
  and it is already a project reference.
- Simulation-Based Calibration (Talts et al., 2018) and TARP (Lemos et al., 2023), the standard
  coverage diagnostics for amortised posteriors, both require known truth, so by construction they run
  on synthetic (or Earth-like known-truth) data, never on unlabelled real data.
- Cranmer, Brehmer, and Louppe (2020), the standard simulation-based-inference review, frames the
  simulator-to-reality validation gap as the field's central open problem, matching this project's own
  finding S3 ("NPE ... fully inherits the simulation-to-real gap that nested sampling avoids").
- A directly on-point, very recent paper on the exact problem of unlabelled real data at deployment
  time in simulation-based inference: "Information-Preserving Domain Transfer with Unlabeled Data in
  Misspecified Simulation-Based Inference" (arXiv:2605.05652, 2026). Its framing matches this project's
  situation precisely: at deployment, real data is unlabelled, which is a domain-transfer and
  model-misspecification problem, not a validation step.

No doc change follows from this section: the existing wording in
[docs/02-methodology.md](../docs/02-methodology.md) is already correct. The citations have been added
to [docs/08-review-and-gaps.md](../docs/08-review-and-gaps.md) S3 and its Sources list so the claim
there is traceable to a primary source.

## Scope boundaries

- MIRI only. Near-infrared stays the demonstration and null-control stream, unchanged.
- Transmission spectra only, matching the project's existing inclusion criteria in
  [docs/04-data-sources.md](../docs/04-data-sources.md).
- Archive-only: nothing here proposes a new observation. The K2-22 b residual finding is a pointer to
  existing, already-taken MAST data, not a request for new telescope time.
- No implementation is included in this spec. It records verified facts and open items; breaking this
  into tickets is a separate step once the data and forward-model stages are scheduled.

## Sources

- Batalha et al., 2017. PandExo: a community tool for transiting exoplanet science with JWST and HST.
  PASP 129, 064501.
- Cranmer, K., Brehmer, J. and Louppe, G., 2020. The frontier of simulation-based inference. PNAS 117,
  30055-30062. <https://doi.org/10.1073/pnas.1912789117>
- Dyrek, A. et al., 2024. SO2, silicate clouds, but no CH4 detected in a warm Neptune. Nature 625, 51.
- Gordon, I.E., Rothman, L.S., Hargreaves, R.J., et al., 2022. The HITRAN2020 molecular spectroscopic
  database. JQSRT 277, 107949.
- HITRAN cross-section definitions. <https://hitran.org/docs/cross-sections-definitions/>
- Lemos, P., Coogan, A., Hezaveh, Y. and Perreault-Levasseur, L., 2023. Sampling-based accuracy testing
  of posterior estimators for general inference (TARP). PMLR 202, 19256-19273.
  <https://arxiv.org/abs/2302.03026>
- Mollière, P. et al., 2019. petitRADTRANS: a Python radiative transfer package for exoplanet
  characterization and retrieval. A&A 627, A67.
- petitRADTRANS: adding opacities documentation.
  <https://petitradtrans.readthedocs.io/en/latest/content/adding_opacities.html>
- petitRADTRANS: available opacity species.
  <https://petitradtrans.readthedocs.io/en/latest/content/available_opacities.html>
- Schwieterman, E.W. et al., 2024. Artificial greenhouse gases as exoplanet technosignatures. ApJ 969,
  20.
- Seager, S. et al., 2023. Fully fluorinated non-carbon compounds NF3 and SF6 as ideal technosignature
  gases. Scientific Reports 13, 13576.
- Talts, S., Betancourt, M., Simpson, D., Vehtari, A. and Gelman, A., 2018. Validating Bayesian
  inference algorithms with simulation-based calibration. <https://arxiv.org/abs/1804.06788>
- Vasist, M., Rozet, F., Absil, O., Mollière, P., Nasedkin, E. and Louppe, G., 2023. Neural posterior
  estimation for exoplanetary atmospheric retrieval. A&A 672, A147.
  <https://doi.org/10.1051/0004-6361/202245263>
- Welbanks, L. et al., 2024. A high internal heat flux and large core in a warm Neptune exoplanet.
  Nature 630, 836. <https://arxiv.org/abs/2405.11018>
- JWST Program Information (STScI), proposals 2722 and 3557 (APT exports).
  <https://www.stsci.edu/jwst-program-info/>
- Information-Preserving Domain Transfer with Unlabeled Data in Misspecified Simulation-Based
  Inference. arXiv:2605.05652 (2026).
- data/MAST/mast_miri_inventory.csv and data/NASA_Archive/nasa_miri_spectra.csv (this repository, the
  primary evidence for the transit-count table above).
