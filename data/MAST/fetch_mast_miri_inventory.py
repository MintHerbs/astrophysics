#!/usr/bin/env python3
"""
fetch_mast_miri_inventory.py
============================
Build an inventory of JWST MIRI transmission-spectroscopy observations held in
the Mikulski Archive for Space Telescopes (MAST), using astroquery.

Scope
-----
The scientifically meaningful MIRI transmission-spectroscopy mode for transiting
exoplanets is MIRI Low Resolution Spectroscopy (LRS) in slitless mode, which is
recorded in MAST as instrument_name "MIRI/SLITLESS" with the P750L disperser and
dataproduct_type "timeseries". This is the same slitless time-series mode used
for both transit (transmission) and eclipse (emission) observations; the two
cannot be told apart from the observation-level metadata alone, so both are
listed and the distinction is left to the reference paper.

Other MIRI time-series modes are deliberately excluded from the inventory and
only reported as a census for transparency:
  - MIRI/IMAGE    photometric time series (no spectrum)
  - MIRI/IFU      Medium Resolution Spectrometer (used for emission and
                  directly imaged objects, not transiting-planet transmission)
  - MIRI/TARGACQ  target acquisition (not science spectra)
  - MIRI/SLIT     LRS fixed-slit (not the slitless time-series transmission mode)

What this script does and does not do
-------------------------------------
It queries the observation catalogue and writes a lightweight CSV inventory of
what exists. It does NOT download the large raw or calibrated FITS products.
Each row records the canonical product URI (dataURL) and a verified per-product
download URL so the data can be fetched later, on purpose, by the user.

Verified facts (checked against the live service and MAST documentation, not
guessed):
  - JWST transit/time-series data is dataproduct_type="timeseries", not
    "spectrum" (a "spectrum" filter excludes every transit).
  - The MIRI transmission-spectroscopy instrument_name value is "MIRI/SLITLESS".
  - CAOM fields em_min and em_max are in nanometres; t_min, t_max and
    t_obs_release are Modified Julian Date (MJD); t_exptime is in seconds.
    Source: https://mast.stsci.edu/api/v0/_c_a_o_mfields.html
  - The per-product download endpoint
    https://mast.stsci.edu/api/v0.1/Download/file?uri=<mast-uri>
    returns the product (verified HTTP 200 for a public X1DINTS product).

Usage
-----
    python data/MAST/fetch_mast_miri_inventory.py

Writes data/MAST/mast_miri_inventory.csv (one row per observation).
"""

from __future__ import annotations

import os
import sys

import pandas as pd

# MIRI transmission-spectroscopy mode kept in the inventory. Kept as a list so
# the scope can be widened deliberately and visibly, never by accident.
MIRI_TRANSMISSION_MODES = ["MIRI/SLITLESS"]

# JWST transit/time-series data is tagged "timeseries", never "spectrum".
DATAPRODUCT_TYPE = "timeseries"

# The MIRI LRS disperser. P750L is the only Low Resolution Spectroscopy element,
# so it is the defining marker of an LRS spectrum. A handful of observations
# returned under instrument_name "MIRI/SLITLESS" instead carry an imaging filter
# (for example F560W, F1000W, F1500W); those are the parallel imaging or
# background exposures that accompany an LRS visit and yield a "_mirimage"
# photometric product, not a spectrum. They are excluded from the spectroscopy
# inventory and reported separately so nothing is hidden.
LRS_DISPERSER = "P750L"

# Human-readable mode label for the instrument_name value.
MODE_LABEL = {
    "MIRI/SLITLESS": "MIRI LRS slitless (Low Resolution Spectroscopy, time-series)",
    "MIRI/SLIT": "MIRI LRS fixed slit (Low Resolution Spectroscopy)",
    "MIRI/IFU": "MIRI MRS (Medium Resolution Spectrometer, integral field)",
    "MIRI/IMAGE": "MIRI imaging time series (photometry)",
    "MIRI/TARGACQ": "MIRI target acquisition",
}

# Canonical MAST per-product download endpoint (verified reachable).
MAST_DOWNLOAD_ENDPOINT = "https://mast.stsci.edu/api/v0.1/Download/file?uri="

# Substrings in the archive's own target_classification that mark a row as a
# background, blank-field or calibration exposure rather than an astrophysical
# science target. Used to set the is_background_or_calibration flag so the
# science transmission-spectroscopy targets can be selected without dropping any
# real rows from the inventory.
BACKGROUND_CAL_MARKERS = (
    "blank field",
    "telescope/sky background",
    "calibration",
    "target acquisition",
)

# Target-name suffixes MAST uses for a reference/background pointing paired with
# a science target (for example "HAT-P-1-BG", "KELT-8-BKG") and for absolute-flux
# calibration standards (for example "HD2811-BKG"). MAST's own
# target_classification field labels these as ordinary stars or exoplanet hosts,
# not "Calibration; ...", so BACKGROUND_CAL_MARKERS alone does not catch them;
# the target name is the only reliable marker. Verified against the live MAST
# CAOM inventory: every "-BG"/"-BKG" target name found was either a background
# pointing for an exoplanet program or a named flux-calibration standard star.
BACKGROUND_TARGET_NAME_SUFFIXES = ("-BG", "-BKG")

OUTPUT_CSV = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                          "mast_miri_inventory.csv")

# Column order and units for the output inventory. Units are stated in the
# column names so the CSV is self-describing.
INVENTORY_COLUMNS = [
    "target_name",
    "target_classification",
    "is_background_or_calibration",
    "instrument_name",
    "observation_mode",
    "filter_disperser",
    "wavelength_min_um",
    "wavelength_max_um",
    "exposure_time_s",
    "obs_start_utc",
    "obs_end_utc",
    "calib_level",
    "proposal_id",
    "proposal_type",
    "proposal_pi",
    "obs_title",
    "ra_deg",
    "dec_deg",
    "release_date_utc",
    "obs_id",
    "obsid",
    "product_uri",
    "product_download_url",
]


def mjd_to_iso(mjd):
    """Modified Julian Date -> 'YYYY-MM-DDTHH:MM:SS' UTC ('' if missing)."""
    from astropy.time import Time
    try:
        if mjd is None or pd.isna(mjd):
            return ""
        return Time(float(mjd), format="mjd", scale="utc").isot[:19]
    except Exception:
        return ""


def nm_to_um(nm):
    """Nanometres -> micrometres, rounded to 4 dp ('' if missing)."""
    try:
        if nm is None or pd.isna(nm):
            return ""
        return round(float(nm) / 1000.0, 4)
    except Exception:
        return ""


def is_background_or_calibration(classification, target_name=None):
    """True if the archive classification marks a background/calibration field,
    or the target name itself marks a reference pointing or flux standard."""
    text = str(classification).lower()
    if any(marker in text for marker in BACKGROUND_CAL_MARKERS):
        return True
    if target_name is not None:
        name = str(target_name).strip().upper()
        if name.endswith(BACKGROUND_TARGET_NAME_SUFFIXES):
            return True
    return False


def product_download_url(data_uri):
    """Build the verified MAST per-product download URL from a mast: URI."""
    if data_uri is None or (isinstance(data_uri, float) and pd.isna(data_uri)):
        return ""
    text = str(data_uri).strip()
    return MAST_DOWNLOAD_ENDPOINT + text if text else ""


def query_miri_timeseries():
    """Query JWST MIRI slitless time-series science observations from MAST."""
    from astroquery.mast import Observations

    print("[MAST] Querying JWST MIRI slitless time-series observations ...")
    obs = Observations.query_criteria(
        obs_collection="JWST",
        dataproduct_type=DATAPRODUCT_TYPE,
        instrument_name=MIRI_TRANSMISSION_MODES,
        intentType="science",
    )
    df = obs.to_pandas() if obs is not None and len(obs) else pd.DataFrame()
    print(f"[MAST] MIRI slitless time-series observations returned: {len(df)}")
    if len(df):
        df = keep_lrs_spectra(df)
    return df


def keep_lrs_spectra(df):
    """Keep only LRS spectroscopy (P750L disperser), dropping the imaging or
    background exposures returned under the same instrument_name."""
    disperser = df["filters"].astype(str).str.upper()
    is_lrs = disperser == LRS_DISPERSER
    dropped = df[~is_lrs]
    if len(dropped):
        other = dropped["filters"].value_counts().to_dict()
        print(f"[MAST] Excluding {len(dropped)} non-spectroscopic rows "
              f"(imaging or background exposures, not LRS spectra): {other}")
    print(f"[MAST] LRS spectra (disperser {LRS_DISPERSER}) kept: "
          f"{int(is_lrs.sum())}")
    return df[is_lrs].copy()


def report_mode_census():
    """Print the full MIRI time-series mode census, for transparency about what
    is and is not included in the inventory. Best effort; failure is non-fatal."""
    from astroquery.mast import Observations
    try:
        allmiri = Observations.query_criteria(
            obs_collection="JWST",
            dataproduct_type=DATAPRODUCT_TYPE,
            intentType="science",
        ).to_pandas()
        miri = allmiri[allmiri["instrument_name"].astype(str)
                       .str.startswith("MIRI")]
        counts = miri["instrument_name"].value_counts().to_dict()
        print("[MAST] MIRI time-series mode census (all science, for context):")
        for name, n in sorted(counts.items()):
            mark = "  KEPT " if name in MIRI_TRANSMISSION_MODES else "  ---- "
            print(f"{mark}{name}: {n}  ({MODE_LABEL.get(name, name)})")
    except Exception as exc:
        print(f"[MAST] Mode census skipped ({exc!r}).")


def build_inventory(df):
    """Shape the raw observation dataframe into the inventory columns."""
    if df is None or len(df) == 0:
        return pd.DataFrame(columns=INVENTORY_COLUMNS)

    out = pd.DataFrame({
        "target_name": df.get("target_name"),
        "target_classification": df.get("target_classification"),
        "is_background_or_calibration": [
            is_background_or_calibration(cls, name)
            for cls, name in zip(df.get("target_classification"), df.get("target_name"))
        ],
        "instrument_name": df.get("instrument_name"),
        "observation_mode": df.get("instrument_name").map(
            lambda v: MODE_LABEL.get(str(v), str(v))),
        "filter_disperser": df.get("filters"),
        "wavelength_min_um": df.get("em_min").map(nm_to_um),
        "wavelength_max_um": df.get("em_max").map(nm_to_um),
        "exposure_time_s": df.get("t_exptime"),
        "obs_start_utc": df.get("t_min").map(mjd_to_iso),
        "obs_end_utc": df.get("t_max").map(mjd_to_iso),
        "calib_level": df.get("calib_level"),
        "proposal_id": df.get("proposal_id"),
        "proposal_type": df.get("proposal_type"),
        "proposal_pi": df.get("proposal_pi"),
        "obs_title": df.get("obs_title"),
        "ra_deg": df.get("s_ra"),
        "dec_deg": df.get("s_dec"),
        "release_date_utc": df.get("t_obs_release").map(mjd_to_iso),
        "obs_id": df.get("obs_id"),
        "obsid": df.get("obsid"),
        "product_uri": df.get("dataURL"),
        "product_download_url": df.get("dataURL").map(product_download_url),
    })
    # Stable ordering so the CSV is reproducible run to run.
    out = out.sort_values(
        ["target_name", "obs_id"], kind="stable"
    ).reset_index(drop=True)
    return out[INVENTORY_COLUMNS]


def main():
    try:
        raw = query_miri_timeseries()
    except Exception as exc:
        print(f"[MAST] Query failed: {exc!r}", file=sys.stderr)
        print("[MAST] No data written. Check network access to "
              "mast.stsci.edu and that astroquery is installed, then re-run.",
              file=sys.stderr)
        return 1

    report_mode_census()

    inventory = build_inventory(raw)
    inventory.to_csv(OUTPUT_CSV, index=False)

    n = len(inventory)
    if n == 0:
        print(f"[MAST] No MIRI slitless time-series observations returned. "
              f"Wrote header-only CSV to {OUTPUT_CSV}.")
    else:
        bg = int(inventory["is_background_or_calibration"].sum())
        science = n - bg
        planets = inventory["target_name"].nunique()
        print(f"[MAST] Wrote {n} LRS slitless observation rows "
              f"({planets} distinct target names) to {OUTPUT_CSV}.")
        print(f"[MAST]   of which astrophysical science targets: {science}; "
              f"background/blank-field or calibration: {bg}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
