# JWST NIR Exoplanet Transmission-Spectroscopy Dataset

Tooling to **define and catalogue** the JWST near-infrared exoplanet
transmission-spectroscopy dataset used by a machine-learning pipeline that
searches transmission spectra for industrial technosignature gases.

This repo contains **code and CSV catalogues only**. The raw/reduced spectra
themselves are **50–200 GB** and are *never* committed here (see
[`.gitignore`](.gitignore)). The catalogue tells you exactly which files make up
the dataset and how to fetch them when you want them.

---

## What the script does

[`app.py`](app.py) runs the [`dataset_builder/`](dataset_builder/) pipeline,
making **two clearly separated queries** against the
[MAST](https://mast.stsci.edu/) archive via `astroquery.mast` and writing two
CSV files. It **does not download any FITS data** — it builds the metadata
catalogue and prints a volume summary.

The logic is split into ordered modules (numbered by pipeline flow):

```
app.py                     # thin entry point: runs the steps in order
dataset_builder/
  __init__.py              # loads the numbered modules under clean names
  01_config.py             # constants: instrument modes, selectors, paths
  02_api_call.py           # the MAST queries (SET A and SET B)
  03_filter.py             # filtering to calibrated science spectra
  04_catalogue.py          # building the two dataframes
  05_summary.py            # the console summary (counts, GB by instrument)
  06_write_csv.py          # writing the two CSVs (lock-resilient)
  07_download.py           # the commented-out download function
```

| Set | `obs_collection` | What it is |
|-----|------------------|------------|
| **SET A — JWST** | `JWST` | Mission-archive near-infrared time-series spectroscopy (the transit/transmission data). **This is the dataset for the pipeline.** |
| **SET B — HLSP** | `HLSP` | High Level Science Products found for the **same targets**. ⚠️ See the honest finding below — for these targets this turned out to be *ground-based host-star* libraries, **not** JWST planet transmission spectra. |

### ⚠️ Honest finding about SET B (HLSP)

The brief assumed HLSP would hold "science-ready, already-reduced transmission
spectra" for these planets. Checked against the live archive, that is **not**
what MAST returns:

* Querying `obs_collection="HLSP"` by these target names yields only
  **ground-based / multi-mission host-star** products — `OWLS` (APO/ARCES
  optical echelle) and `MUSCLES` (UV–optical stellar SEDs). Those are
  *host-star* spectra, not *planet* transmission spectra.
* The textbook JWST transmission targets **WASP-39** and **WASP-96** return
  **zero** HLSP rows at all.
* Broad `HLSP` + JWST-instrument queries return tens of thousands of
  **deep-field galaxy** survey spectra (JADES, CEERS, …) — also not exoplanets.

**Conclusion:** as of this run there are no JWST reduced transmission-spectrum
HLSPs catalogued in MAST CAOM under these target names. SET B is kept (clearly
labelled, with a `provenance` column) so you can see exactly what exists, but it
is **host-star context, not pipeline-ready planet spectra**. Re-running later
will automatically pick up real JWST transmission-spectrum HLSPs if/when they
are deposited.

> Matching note: MAST forbids more than one wildcard per filter, so SET B is
> matched by **exact** target name. Name variants (e.g. `WASP-39` vs
> `WASP-39 b`) may not match — but since the only matches are host-star
> libraries anyway, this does not affect the usable dataset.

Both sets are restricted to the **near-infrared spectroscopic time-series**
instrument modes:

* `NIRSPEC/SLIT` — NIRSpec Bright Object Time Series (BOTS)
* `NIRISS/SOSS` — Single-Object Slitless Spectroscopy
* `NIRCAM/GRISM` — NIRCam Grism Time Series

(MIRI is excluded as mid-infrared; `NIRCAM/IMAGE` is excluded as photometry, not
spectroscopy; `NIRSPEC/MSA` and `NIRSPEC/IFU` are excluded as non-transit modes.)

For each set the script pulls the product file list and keeps **only
science-ready calibrated spectra** (`productType == SCIENCE`, calibration
level ≥ 2), skipping raw level-1 (`_uncal`) and intermediate products.

---

## ⚠️ Important note on MAST field names

The brief asked to filter on `dataproduct_type = "spectrum"` **and** restrict to
time-series/transit observations. Checked against the **live** astroquery field
list (June 2026), those two are in direct conflict, so the script does something
deliberately different — this is documented, not a silent work-around:

* MAST's CAOM schema has **no** "observing mode" / "template" / "time-series"
  field. The only time-related fields are `t_min`, `t_max`, `t_exptime`
  (exposure timing — not a TSO-mode flag).
* JWST transit / time-series observations are labelled
  **`dataproduct_type == "timeseries"`**, *not* `"spectrum"`. Verified on the
  textbook transiting exoplanet **WASP-39**: it returns `timeseries` products
  and **zero** `spectrum` products.
* `dataproduct_type == "spectrum"` returns ~175k NIRSpec/MSA **survey** spectra
  (not transits). Filtering on `"spectrum"` would **exclude the entire dataset
  we want**.

**Therefore the time-series-mode selector used is `dataproduct_type =
"timeseries"`.** If a future MAST data release adds a real observing-mode field,
update `TIMESERIES_TYPE` / `NIR_TSO_MODES` in `dataset_builder/01_config.py`.

---

## Dataset snapshot (most recent run — 2026-06-28)

Numbers grow as JWST keeps observing; re-run to refresh.

**SET A — JWST (the pipeline dataset)**

| | |
|---|---|
| Unique targets | 214 |
| Observations | 1,192 |
| Science-ready spectra (files) | 3,924 |
| Total data volume | **~1,020 GB** |

Volume by instrument: `NIRSPEC/SLIT` ≈ 677 GB · `NIRCAM/GRISM` ≈ 198 GB ·
`NIRISS/SOSS` ≈ 145 GB. (Confirms the brief's "50–200 GB" is an underestimate
for the full NIR time-series spectroscopy holdings — budget accordingly before
downloading.)

**SET B — HLSP (host-star context only — see finding above)**

24 targets · 51 observations · 149 files · ~0.9 GB · all `OWLS` / `MUSCLES` /
`LOWLIB` / `MSTARPANSPEC` (ground-based / multi-mission host-star spectra).

> Two scope caveats the script also prints: (1) MAST has no field separating
> **transmission** (transit) from **emission** (eclipse) / phase-curve time
> series — they share instrument modes, so SET A is *all* NIR time-series
> spectroscopy; isolating pure transits needs an external ephemeris/planet list.
> (2) SET A includes a few non-transiting targets that use the same modes
> (brown dwarfs, directly-imaged companions) and calibration standard stars.

## How to run

```bash
# 1. Create and activate the virtual environment
python -m venv venv
# Windows (PowerShell):
venv\Scripts\Activate.ps1
# macOS / Linux:
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Build the catalogue (no downloads — metadata only)
python app.py
```

The script prints a summary to the console (unique planets, observation count,
total data volume in GB broken down by instrument) and writes the two CSVs into
this folder.

---

## Output files

### `dataset_catalogue.csv` — one row per observation

| Column | Meaning |
|--------|---------|
| `set` | `JWST` or `HLSP` (which query the row came from). |
| `target_name` | Planet/host target name as recorded by MAST. |
| `instrument` | MAST `instrument_name` (e.g. `NIRSPEC/SLIT`). |
| `provenance` | Data provenance (e.g. `CALJWST` for SET A; `OWLS`/`MUSCLES` for SET B). |
| `filters_grating` | Filter / grating combination (e.g. `F290LP;G395H`). |
| `observation_mode` | Plain-English mode (BOTS / SOSS / Grism TSO), derived from the instrument. |
| `exposure_time_s` | Exposure time in seconds (`t_exptime`). |
| `proposal_id` | JWST proposal ID. |
| `proposal_pi` | Principal investigator surname. |
| `release_date` | Public release date (converted from MJD to `YYYY-MM-DD`). |
| `obs_id` | **Stable** mission observation identifier. |
| `obsid` | Numeric MAST database id (joins to the files table). |
| `calib_level` | Calibration level of the observation. |
| `wavelength_region` | Energy band label from MAST. |

### `dataset_files.csv` — one row per downloadable file

| Column | Meaning |
|--------|---------|
| `set` | `JWST` or `HLSP`. |
| `file_name` | Product file name. |
| `product_type` | MAST product type (`SCIENCE`). |
| `product_subgroup` | Product subgroup (e.g. `X1DINTS`, `X1D`, `WHTLT`). |
| `calib_level` | Calibration level of the file. |
| `size_bytes` | File size in bytes. |
| `data_uri` | **MAST data URI** used to fetch the file. |
| `parent_obsid` | Joins back to `obsid` in the catalogue. |

Join the two tables on `dataset_files.parent_obsid == dataset_catalogue.obsid`.

---

## Downloading the actual FITS data (off by default)

Downloading is intentionally **disabled**. `dataset_builder/07_download.py`
holds a commented-out `download_products()` function. To fetch the data later:

1. Uncomment `download_products`, import it in `app.py`, and call it in `main()`.
2. Point `download_dir` at a location **outside** the repo, or at one of the
   git-ignored folders (`data/`, `mastDownload/`, `downloads/`).
3. Re-run the script. **Expect 50–200 GB.**

Never `git add` the downloaded FITS/ASDF files — `.gitignore` already blocks the
usual locations and extensions, but stay alert.

---

## Requirements

See [`requirements.txt`](requirements.txt): `astroquery`, `pandas`, `numpy`
(astropy and friends come in as transitive dependencies). Tested on Python 3.11.
