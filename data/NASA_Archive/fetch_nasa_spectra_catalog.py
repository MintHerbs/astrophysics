#!/usr/bin/env python3
"""
fetch_nasa_spectra_catalog.py
==============================
Fetch the full catalogue of published JWST transmission spectra (all
instruments) from the NASA Exoplanet Archive Atmospheric Spectroscopy table,
using its TAP service, and write it in the schema the frontend's NASA view
consumes.

Scope
-----
The NASA Exoplanet Archive exposes published atmospheric spectra in a single
TAP table named "spectra" (the Atmospheric Spectroscopy table, which in
July 2023 replaced the retired Emission and Transmission Spectroscopy
tables). This script keeps every published transmission spectrum, across all
instruments:

    spec_type = 'Transmission'

Both the MIRI subset (the scientifically meaningful sample for this project)
and the near-infrared rows (demonstration and null-control data, per
docs/04-data-sources.md) are kept in one catalogue, matching the design of
frontend/src/lib/server/buildDataset.ts's buildNasa(), which reads this file
directly. The MIRI-only catalogue used elsewhere in the pipeline is built
separately by fetch_nasa_miri_spectra.py and is not duplicated here.

Why this script exists
-----------------------
data/NASA_Archive/spectra.csv was previously a one-off manual download (see
data/NASA_Archive/execution.bash), fetched via `curl` from a session-scoped
temporary URL. That snapshot had two problems, found by direct inspection and
by re-querying the live archive:
  - Its NOTE field was written with unquoted commas, so a standards-compliant
    CSV parser (including the frontend's own parseCsv()) reads extra fields
    on most rows and silently drops everything past the header's column
    count.
  - It carried 41 rows for 14 planets, versus 872 Transmission-type rows for
    194 planets in the live archive at the time of the July 2026 audit: a
    small, undated fragment, not a representative sample.
This script replaces that manual snapshot with a reproducible, correctly
quoted, complete pull.

Verified facts (checked against the live service and the archive
documentation, not guessed):
  - TAP sync endpoint base:
    https://exoplanetarchive.ipac.caltech.edu/TAP/sync
    Source: https://exoplanetarchive.ipac.caltech.edu/docs/TAP/usingTAP.html
  - The atmospheric-spectroscopy table is named "spectra".
  - Column units, from TAP_SCHEMA.columns: minwavelng and maxwavelng are in
    microns; mintranmid and maxtranmid are in BJD; num_datapoints is a count.
  - The spec_path field is the archive-internal file path. There is no
    stable public direct-download URL for the .tbl files: the archive serves
    them only through the Firefly interface "Download All Checked Spectra"
    action, which generates time-limited wget commands (documented at
    https://exoplanetarchive.ipac.caltech.edu/docs/atmospheres/atmospheres_work.html).
    spec_path is recorded verbatim for completeness and to match a file
    downloaded separately by that mechanism.

What this script does and does not do
---------------------------------------
It writes a lightweight CSV catalogue of every published transmission
spectrum the table lists. It does NOT download the spectrum data files
themselves.

Usage
-----
    python data/NASA_Archive/fetch_nasa_spectra_catalog.py

Writes data/NASA_Archive/spectra.csv (one row per published transmission
spectrum), overwriting the previous manually-downloaded snapshot.
"""

from __future__ import annotations

import io
import os
import sys

import pandas as pd
import requests

TAP_SYNC_URL = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync"

# The exact ADQL query. Columns are the retrievable Panel-1 columns of the
# spectra table, matching the ones fetch_nasa_miri_spectra.py already uses.
# spec_type values in the table are 'Transmission', 'Eclipse' and
# 'Direct Imaging'; only Transmission is kept, matching this project's scope.
ADQL_QUERY = (
    "select pl_name, spec_path, spec_type, bibcode, authors, "
    "num_datapoints, instrument, facility, "
    "minwavelng, maxwavelng, mintranmid, maxtranmid, note "
    "from spectra "
    "where spec_type = 'Transmission' "
    "order by pl_name"
)

# TAP queries on this service can be slow to warm up; allow a generous read.
TAP_TIMEOUT_S = 300

OUTPUT_CSV = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                          "spectra.csv")

# Output column order matches the archive's own uppercase export format,
# which frontend/src/lib/server/buildDataset.ts::buildNasa() and
# frontend/src/lib/server/paths.ts (NASA_SPECTRA_CSV) already expect.
OUTPUT_COLUMNS = [
    "PL_NAME",
    "SPEC_PATH",
    "SPEC_TYPE",
    "BIBCODE",
    "AUTHORS",
    "NUM_DATAPOINTS",
    "INSTRUMENT",
    "FACILITY",
    "MINWAVELNG",
    "MAXWAVELNG",
    "MINTRANMID",
    "MAXTRANMID",
    "NOTE",
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


def build_catalog(df):
    """Shape the raw TAP result into the output columns. pandas.to_csv quotes
    any field containing a comma, unlike the manual export it replaces."""
    if df is None or len(df) == 0:
        return pd.DataFrame(columns=OUTPUT_COLUMNS)

    out = pd.DataFrame({
        "PL_NAME": df.get("pl_name"),
        "SPEC_PATH": df.get("spec_path"),
        "SPEC_TYPE": df.get("spec_type"),
        "BIBCODE": df.get("bibcode"),
        "AUTHORS": df.get("authors"),
        "NUM_DATAPOINTS": df.get("num_datapoints"),
        "INSTRUMENT": df.get("instrument"),
        "FACILITY": df.get("facility"),
        "MINWAVELNG": df.get("minwavelng"),
        "MAXWAVELNG": df.get("maxwavelng"),
        "MINTRANMID": df.get("mintranmid"),
        "MAXTRANMID": df.get("maxtranmid"),
        "NOTE": df.get("note"),
    })
    out = out.sort_values(
        ["PL_NAME", "BIBCODE"], kind="stable"
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

    catalog = build_catalog(raw)
    catalog.to_csv(OUTPUT_CSV, index=False)

    n = len(catalog)
    if n == 0:
        print(f"[NASA] No Transmission spectra returned. "
              f"Wrote header-only CSV to {OUTPUT_CSV}.")
    else:
        planets = catalog["PL_NAME"].nunique()
        miri = catalog["INSTRUMENT"].astype(str).str.contains("MIRI").sum()
        print(f"[NASA] Wrote {n} published-spectrum rows "
              f"({planets} distinct planets) to {OUTPUT_CSV}.")
        print(f"[NASA]   of which MIRI (science sample): {miri}; "
              f"near-infrared or other (null control): {n - miri}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
