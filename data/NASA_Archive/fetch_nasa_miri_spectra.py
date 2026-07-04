#!/usr/bin/env python3
"""
fetch_nasa_miri_spectra.py
==========================
Fetch the inventory of published JWST MIRI transmission spectra from the NASA
Exoplanet Archive Atmospheric Spectroscopy table, using its TAP service.

Scope
-----
The NASA Exoplanet Archive exposes published atmospheric spectra in a single
TAP table named "spectra" (the Atmospheric Spectroscopy table, which in
July 2023 replaced the retired Emission and Transmission Spectroscopy tables).
Each row is one published spectrum, tagged by spec_type as Transmission,
Eclipse or Direct Imaging. This script keeps only MIRI transmission spectra:

    instrument LIKE '%MIRI%'  AND  spec_type = 'Transmission'

Verified facts (checked against the live service and the archive documentation,
not guessed):
  - TAP sync endpoint base:
    https://exoplanetarchive.ipac.caltech.edu/TAP/sync
    Source: https://exoplanetarchive.ipac.caltech.edu/docs/TAP/usingTAP.html
  - The atmospheric-spectroscopy table is named "spectra".
  - Column units, from TAP_SCHEMA.columns: minwavelng and maxwavelng are in
    microns; mintranmid and maxtranmid are in BJD; num_datapoints is a count.
  - The spec_path field is the archive-internal file path. There is no stable
    public direct-download URL for the .tbl files: the archive serves them only
    through the Firefly interface "Download All Checked Spectra" action, which
    generates time-limited wget commands (documented at
    https://exoplanetarchive.ipac.caltech.edu/docs/atmospheres/atmospheres_work.html
    and noted by Hsu et al. 2026, the ASTER toolkit paper). The stable,
    reachable reference for each spectrum is therefore its bibcode, which this
    script also renders as an ADS URL. spec_path is recorded verbatim for
    completeness.

What this script does and does not do
-------------------------------------
It writes a lightweight CSV inventory of the published MIRI transmission spectra
the table lists. It does NOT download the spectrum data files themselves.

Usage
-----
    python data/NASA_Archive/fetch_nasa_miri_spectra.py

Writes data/NASA_Archive/nasa_miri_spectra.csv (one row per published spectrum).
"""

from __future__ import annotations

import io
import os
import sys

import pandas as pd
import requests

TAP_SYNC_URL = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync"

# The exact ADQL query. Columns are the retrievable Panel-1 columns of the
# spectra table. spec_type values in the table are 'Transmission', 'Eclipse'
# and 'Direct Imaging'; only Transmission is kept.
ADQL_QUERY = (
    "select pl_name, instrument, spec_type, facility, "
    "minwavelng, maxwavelng, mintranmid, maxtranmid, "
    "num_datapoints, bibcode, authors, note, spec_path "
    "from spectra "
    "where instrument like '%MIRI%' and spec_type = 'Transmission' "
    "order by pl_name"
)

# ADS resolves any bibcode; this is the stable, reachable reference per row.
ADS_ABS_URL = "https://ui.adsabs.harvard.edu/abs/"

# TAP queries on this service can be slow to warm up; allow a generous read.
TAP_TIMEOUT_S = 300

OUTPUT_CSV = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                          "nasa_miri_spectra.csv")

# Output column order and units (stated in the names so the CSV self-describes).
OUTPUT_COLUMNS = [
    "pl_name",
    "instrument",
    "spec_type",
    "facility",
    "wavelength_min_um",
    "wavelength_max_um",
    "transit_mid_min_bjd",
    "transit_mid_max_bjd",
    "num_datapoints",
    "reference_bibcode",
    "reference_url",
    "authors",
    "note",
    "spec_path",
]


def run_tap_query(query):
    """Run an ADQL query against the TAP sync endpoint; return a DataFrame."""
    print(f"[NASA] Querying TAP: {TAP_SYNC_URL}")
    print(f"[NASA] ADQL: {query}")
    resp = requests.get(
        TAP_SYNC_URL,
        params={"query": query, "format": "csv"},
        timeout=TAP_TIMEOUT_S,
    )
    resp.raise_for_status()
    text = resp.text
    if not text.strip():
        return pd.DataFrame()
    return pd.read_csv(io.StringIO(text))


def ads_url(bibcode):
    """Render a bibcode as a stable ADS abstract URL ('' if missing)."""
    if bibcode is None or (isinstance(bibcode, float) and pd.isna(bibcode)):
        return ""
    text = str(bibcode).strip()
    return ADS_ABS_URL + text if text else ""


def build_inventory(df):
    """Shape the raw TAP result into the output columns."""
    if df is None or len(df) == 0:
        return pd.DataFrame(columns=OUTPUT_COLUMNS)

    out = pd.DataFrame({
        "pl_name": df.get("pl_name"),
        "instrument": df.get("instrument"),
        "spec_type": df.get("spec_type"),
        "facility": df.get("facility"),
        "wavelength_min_um": df.get("minwavelng"),
        "wavelength_max_um": df.get("maxwavelng"),
        "transit_mid_min_bjd": df.get("mintranmid"),
        "transit_mid_max_bjd": df.get("maxtranmid"),
        "num_datapoints": df.get("num_datapoints"),
        "reference_bibcode": df.get("bibcode"),
        "reference_url": df.get("bibcode").map(ads_url),
        "authors": df.get("authors"),
        "note": df.get("note"),
        "spec_path": df.get("spec_path"),
    })
    out = out.sort_values(
        ["pl_name", "reference_bibcode"], kind="stable"
    ).reset_index(drop=True)
    return out[OUTPUT_COLUMNS]


def main():
    try:
        raw = run_tap_query(ADQL_QUERY)
    except Exception as exc:
        print(f"[NASA] TAP query failed: {exc!r}", file=sys.stderr)
        print("[NASA] No data written. Check network access to "
              "exoplanetarchive.ipac.caltech.edu, then re-run.", file=sys.stderr)
        return 1

    inventory = build_inventory(raw)
    inventory.to_csv(OUTPUT_CSV, index=False)

    n = len(inventory)
    if n == 0:
        print(f"[NASA] No MIRI transmission spectra returned. "
              f"Wrote header-only CSV to {OUTPUT_CSV}.")
    else:
        planets = inventory["pl_name"].nunique()
        print(f"[NASA] Wrote {n} published-spectrum rows "
              f"({planets} distinct planets) to {OUTPUT_CSV}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
