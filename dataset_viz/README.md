# Dataset visualizations

Health and overview plots for the JWST near-infrared exoplanet
transmission-spectroscopy dataset (being prepared for a machine-learning
technosignature search).

Figures are produced by [`../visualize.py`](../visualize.py) and written to
`dataset_viz/figures/` at 150 dpi. The PNGs are **git-ignored** (regenerable);
only this code and README are committed. Regenerate with `python visualize.py`.

All numbers below were recomputed from `dataset_catalogue.csv` and
`dataset_files.csv`. **Snapshot: 2026-06-28.** They will change as JWST observes
more and as the CSVs are rebuilt.

## Dataset at a glance

- **1,243 observations** — 1,192 JWST + 51 HLSP.
- **4,073 science files**, **~1,021 GB** total (JWST 1,020.5 GB, HLSP 0.9 GB).
- **216 unique target names** (214 on JWST, 24 on HLSP, 22 shared) — but this is
  inflated by naming variants (see `targets_per_instrument`).

---

## observations_per_instrument.png

**Shows:** Number of observations per instrument, all rows in the catalogue.

**Numbers:** NIRSPEC/SLIT 825, NIRISS/SOSS 275, NIRCAM/GRISM 92 (JWST);
ARCES 40, MULTI 10, STIS/CCD 1 (HLSP).

**Read it:** NIRSpec BOTS is the backbone of the science set (825 of 1,192 JWST
observations). **Data-quality flag:** the last three bars (ARCES, MULTI,
STIS/CCD = 51 observations) are **not JWST**. They are ground-based / HST
host-star spectra pulled in by the HLSP query, not planet transmission spectra.
Drop them before training, or keep them only as stellar context.

---

## volume_gb_per_instrument.png

**Shows:** Total data volume in GB per instrument (summed file sizes).

**Numbers:** NIRSPEC/SLIT 677.3 GB, NIRCAM/GRISM 198.2 GB, NIRISS/SOSS 144.9 GB;
HLSP instruments together < 1 GB.

**Read it:** The download budget is ~1 TB and dominated by NIRSpec. Note
NIRCAM/GRISM holds 198 GB from only 92 observations — a large per-observation
footprint, more volume than NIRISS/SOSS's 275 observations. Plan storage by
instrument, not by observation count.

---

## targets_per_instrument.png

**Shows:** Number of unique `target_name` values per instrument.

**Numbers:** NIRSPEC/SLIT 150, NIRISS/SOSS 71, NIRCAM/GRISM 43; ARCES 15,
MULTI 10, STIS/CCD 1.

**Read it:** Sky/target breadth per mode; NIRSpec covers the most targets.
**Data-quality flag:** counts use raw `target_name` strings, so naming variants
inflate them. Examples in the data: `P330E` vs `P330-E`; `L-98-59` vs `L98-59`
vs `L98-59-updated`; `WD1856+534` vs `WD1856B`; plus `-offset` / `-copy` /
`-updated` suffixes. The true count of distinct systems is lower. Normalising
names (ideally against the NASA Exoplanet Archive) is needed before trusting
per-target tallies.

---

## exposure_time_histogram.png

**Shows:** Distribution of exposure time. Column is `exposure_time_s` (MAST's
`t_exptime`). The red dashed line flags exposures under 60 s.

**Numbers:** 1,234 observations have a value (9 are missing). Median ≈ 14,689 s
(~4.1 h), mean ≈ 15,641 s, max ≈ 132,746 s (~36.9 h). **121 observations are
under 60 s** (74 under 10 s). The shortest include `TOI-455-revised` at 0.00 s,
`ACQ-STAR-FOR-WASP-107` at 0.04 s, and several sub-second white-dwarf / 2MASS /
Gaia pointings.

**Read it:** The bulk (median ~4 h) is consistent with real transit
time-series, which is good. **Data-quality flag:** the 121 sub-60 s exposures
are almost certainly **target-acquisition or calibration frames, not science
transits** (one is named `ACQ-STAR...`, one is 0.00 s). Exclude them before
training. The 9 missing-exposure rows also need checking.

---

## files_per_target_top30.png

**Shows:** File count for the 30 targets with the most files.

**Numbers (top of the list):** PSO318 210, TRAPPIST-1 199, AU-MIC 172,
BD+60-1753 106, 55CNC 96, LP-890-9 80, BD+40-2790 72, V-V1298-Tau 67, K2-18 60.

**Read it:** Shows where the data mass concentrates — useful for class balance
in training. **Data-quality flag:** several heavy-file targets are **not
transiting planets**. `PSO318` (PSO J318.5-22) is a free-floating
planetary-mass object; `VHS1256B` (49 files) is a directly-imaged companion;
`BD+60-1753` and `BD+40-2790` look like flux-calibration standard stars
(BD+60-1753 is a known JWST standard); `AU-MIC` is a young, active star. So a
large share of the file volume is non-transit data. Which targets are genuine
transiting planets must be confirmed by cross-checking the **NASA Exoplanet
Archive** — it cannot be decided from these CSVs alone.

---

## observations_timeline.png

**Shows:** Observations per release-date month.

**Numbers:** Release dates span 2022-07-13 to 2027-06-13. **134 observations
(all JWST) have release dates after the 2026-06-28 snapshot.**

**Read it:** ~1,058 of 1,192 JWST observations are public now; the other 134 are
still **proprietary and not yet downloadable**, becoming available on a rolling
basis through mid-2027. The download script will not be able to fetch those
until their embargo lifts — schedule accordingly and re-run the catalogue later
to pick them up.

---

## summary.png

**Shows:** Combined multi-panel overview — observations per instrument, GB per
instrument, the exposure-time histogram, and the release-month timeline in one
2×2 figure.

**Read it:** The single dashboard for a health check. At a glance: NIRSpec-heavy,
~1 TB, median ~4 h exposures with a spike of ultra-short frames to remove, and a
tail of releases extending into 2027.

---

## Data-quality summary (act on these before training)

1. **51 non-JWST rows** (HLSP: ARCES/MULTI/STIS-CCD) are host-star spectra, not
   transmission spectra.
2. **121 sub-60 s exposures + 9 missing** look like acquisition/calibration, not
   science transits.
3. **134 JWST observations are proprietary** (future release dates) and not yet
   downloadable.
4. **Non-transit targets are present** (free-floating PSO318, directly-imaged
   VHS1256B, brown/white dwarfs, standard stars). Per-target planet status needs
   a **NASA Exoplanet Archive** cross-check — it is not in these CSVs.
5. **Target-name variants inflate counts** (`P330E`/`P330-E`,
   `L-98-59`/`L98-59`/`L98-59-updated`, `-offset`/`-copy`/`-updated`). Normalise
   names before per-target analysis.
