# Data: real MIRI transmission-spectroscopy inventory

This directory holds the real MIRI transmission-spectroscopy data inventory pulled from the two
archives the project uses, and the scripts that regenerate it. Background on the data streams and the
hygiene rules is in [../docs/04-data-sources.md](../docs/04-data-sources.md) and
[../.claude/rules/data.md](../.claude/rules/data.md).

Scope of this fetch: MIRI only. Near-infrared spectra are out of scope here. The two archives do not
expose a single tidy MIRI spectra file, so each is handled on its own terms:

- MAST exposes observation-level products. The inventory lists MIRI Low Resolution Spectroscopy (LRS)
  slitless time-series observations, the mode used for transiting-exoplanet transmission (and
  eclipse) spectroscopy.
- The NASA Exoplanet Archive exposes published, reduced spectra in its Atmospheric Spectroscopy
  table. The inventory lists the rows tagged as MIRI transmission spectra.

Neither script downloads the bulk data products. Each writes a small, human-inspectable CSV inventory
of what exists in the archive, with a reference for retrieving each item on purpose later.

## Contents

- [MAST/fetch_mast_miri_inventory.py](MAST/fetch_mast_miri_inventory.py): queries MAST via astroquery.
- [MAST/mast_miri_inventory.csv](MAST/mast_miri_inventory.csv): the MAST inventory (one row per
  observation).
- [NASA_Archive/fetch_nasa_miri_spectra.py](NASA_Archive/fetch_nasa_miri_spectra.py): queries the NASA
  Exoplanet Archive TAP service.
- [NASA_Archive/nasa_miri_spectra.csv](NASA_Archive/nasa_miri_spectra.csv): the NASA inventory (one
  row per published spectrum).

## Row counts from the most recent run (2026-07-04)

| Source | Query | Rows written | Notes |
| --- | --- | --- | --- |
| MAST | JWST MIRI LRS slitless time-series (P750L) | 176 | 115 distinct target names. 155 astrophysical science targets, 21 background/blank-field or calibration exposures (flagged). 83 rows are classified as exoplanet or exoplanet-system targets. |
| NASA Exoplanet Archive | `spectra` table, MIRI, transmission | 24 | 9 distinct planets: GJ 1214 b, K2-18 b, K2-22 b, L 168-9 b, LTT 3780 c, WASP-107 b, WASP-17 b, WASP-39 b, WASP-43 b. Several planets have more than one published spectrum (different papers or reductions). |

The MIRI transmission-spectroscopy sample is genuinely small, which is expected: MIRI is the newest
JWST spectroscopic mode for transiting exoplanets and only a modest number of programmes have used it
so far. A small sample is the anticipated outcome, not an error. These counts reflect the archives on
the run date and will grow as new programmes are released.

Every row is real data returned by the query. No rows, planet names, wavelengths, or values were
invented. Both queries returned data in this environment.

## Regenerating the inventories

Requirements: Python 3.11 or newer, with `astroquery` and `astropy` (for MAST), and `pandas` and
`requests` (for both). For example:

```
python -m pip install astroquery astropy pandas requests
```

Run from the repository root:

```
python data/MAST/fetch_mast_miri_inventory.py
python data/NASA_Archive/fetch_nasa_miri_spectra.py
```

Each script prints what it did and the row counts, and overwrites its CSV in place. The output is
deterministic for a given state of the archives: the row order is sorted and no run timestamps are
written into the CSVs, so re-running only changes a file when the archive contents have changed.

If a query returns nothing, the script writes a CSV containing only the header row and says so on
standard output. If the network is blocked or a service is unreachable, the script prints an error,
writes nothing, and exits non-zero. It never invents data.

## MAST inventory: what it is and how it was built

Source archive: Mikulski Archive for Space Telescopes (MAST), <https://archive.stsci.edu/>, queried
programmatically with `astroquery.mast.Observations`.

Query criteria (verified against the live service, not guessed):

- `obs_collection="JWST"`
- `dataproduct_type="timeseries"` (JWST transit and time-series data is tagged `timeseries`, never
  `spectrum`; a `spectrum` filter excludes every transit)
- `instrument_name="MIRI/SLITLESS"` (the MIRI LRS slitless mode)
- `intentType="science"`

From those results the script keeps only rows whose disperser (`filters`) is `P750L`, the sole MIRI
LRS spectroscopy element. A small number of observations returned under the same instrument name
instead carry an imaging filter (F560W, F1000W, F1500W); those are the parallel imaging or background
exposures that accompany an LRS visit and produce a photometric `_mirimage` product rather than a
spectrum. The most recent run excluded 14 such rows and kept 176 LRS spectra.

The `is_background_or_calibration` column flags rows whose archive classification marks them as a
blank field, a telescope or sky background, a calibration, or a target-acquisition exposure. These
are real LRS slitless products but not planet transmission spectra, so they are flagged rather than
dropped, letting the science targets be selected without discarding any real row.

For context and transparency, the script also prints a census of every MIRI time-series mode
(MIRI/IFU, MIRI/IMAGE, MIRI/SLIT, MIRI/SLITLESS, MIRI/TARGACQ). Only MIRI/SLITLESS is included; the
MRS integral-field mode (MIRI/IFU) and imaging mode (MIRI/IMAGE) are not transiting-exoplanet
transmission spectroscopy.

Columns (units stated in the names):

| Column | Meaning |
| --- | --- |
| `target_name` | MAST target name |
| `target_classification` | archive object classification |
| `is_background_or_calibration` | True if a background, blank-field or calibration exposure |
| `instrument_name` | MAST instrument and submode string (MIRI/SLITLESS) |
| `observation_mode` | plain-language mode label |
| `filter_disperser` | disperser or filter element (P750L for LRS spectra) |
| `wavelength_min_um`, `wavelength_max_um` | wavelength coverage in micrometres, converted from the CAOM `em_min`/`em_max` fields (documented in nanometres) |
| `exposure_time_s` | total exposure time in seconds (`t_exptime`) |
| `obs_start_utc`, `obs_end_utc` | observation window in UTC, converted from the MJD `t_min`/`t_max` fields |
| `calib_level` | MAST calibration level |
| `proposal_id`, `proposal_type`, `proposal_pi` | programme identifiers |
| `obs_title` | programme title |
| `ra_deg`, `dec_deg` | target coordinates in degrees |
| `release_date_utc` | data release date in UTC |
| `obs_id` | stable mission observation identifier |
| `obsid` | numeric MAST observation id |
| `product_uri` | canonical MAST product URI (`mast:...`), the calibrated 1-D product (X1DINTS) |
| `product_download_url` | full download URL built from the product URI (see below) |

Retrieving the actual data: the CSV is an inventory, not the spectra. To download a product on
purpose, pass its `product_uri` to the MAST download endpoint, which is the value already given in
`product_download_url`:

```
https://mast.stsci.edu/api/v0.1/Download/file?uri=<product_uri>
```

This endpoint was verified to return a product (HTTP 200) for a public X1DINTS file. Downloaded FITS
products are large and must never be committed; `.gitignore` blocks `*.fits` and the download
directories.

Field units are documented at the MAST CAOM field reference:
<https://mast.stsci.edu/api/v0/_c_a_o_mfields.html> (em_min and em_max in nm; t_min, t_max and
t_obs_release in MJD; t_exptime in seconds).

## NASA Exoplanet Archive inventory: what it is and how it was built

Source archive: NASA Exoplanet Archive, <https://exoplanetarchive.ipac.caltech.edu/>, queried through
its Table Access Protocol (TAP) service. The sync endpoint is
<https://exoplanetarchive.ipac.caltech.edu/TAP/sync>, documented at
<https://exoplanetarchive.ipac.caltech.edu/docs/TAP/usingTAP.html>.

Table: `spectra`, the Atmospheric Spectroscopy table, which in July 2023 replaced the retired
Emission and Transmission Spectroscopy tables. Each row is one published spectrum, tagged by
`spec_type` as Transmission, Eclipse or Direct Imaging.

Exact query (ADQL):

```sql
select pl_name, instrument, spec_type, facility,
       minwavelng, maxwavelng, mintranmid, maxtranmid,
       num_datapoints, bibcode, authors, note, spec_path
from spectra
where instrument like '%MIRI%' and spec_type = 'Transmission'
order by pl_name
```

Columns (units stated in the names):

| Column | Meaning |
| --- | --- |
| `pl_name` | planet name |
| `instrument` | instrument as recorded by the archive (for example "Mid-Infrared Instrument (MIRI) - LRS") |
| `spec_type` | spectrum type (Transmission for every row here) |
| `facility` | observing facility |
| `wavelength_min_um`, `wavelength_max_um` | wavelength coverage in micrometres (`minwavelng`/`maxwavelng`, already in microns) |
| `transit_mid_min_bjd`, `transit_mid_max_bjd` | transit-midpoint range in BJD (`mintranmid`/`maxtranmid`) |
| `num_datapoints` | number of spectral data points in the published spectrum |
| `reference_bibcode` | the publication bibcode |
| `reference_url` | stable ADS abstract URL built from the bibcode |
| `authors` | author list |
| `note` | archive note on the spectrum |
| `spec_path` | archive-internal file path to the spectrum data file |

Retrieving the actual spectra: the spectrum data files (`.tbl`) do not have a stable public
direct-download URL. The archive serves them only through the Atmospheric Spectroscopy (Firefly)
interface at <https://exoplanetarchive.ipac.caltech.edu/cgi-bin/atmospheres/nph-firefly?atmospheres>,
where you filter and check spectra and use "Download All Checked Spectra" to generate wget commands.
Those commands are time-limited and not persistent, so no permanent file URL can be recorded here.
This is confirmed by the archive documentation
(<https://exoplanetarchive.ipac.caltech.edu/docs/atmospheres/atmospheres_work.html>) and independent
usage reports. The stable, reachable reference for each spectrum is therefore its `reference_bibcode`
and the `reference_url` (ADS) that this inventory records; `spec_path` is kept verbatim for
completeness. Downloaded `.tbl` files must never be committed; `.gitignore` blocks `*.tbl` and the
download directories.

Column units were confirmed from the table's own schema (`TAP_SCHEMA.columns` for `table_name =
'spectra'`): `minwavelng` and `maxwavelng` in microns, `mintranmid` and `maxtranmid` in BJD.
