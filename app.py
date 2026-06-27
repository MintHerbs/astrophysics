#!/usr/bin/env python3
"""Entry point for building the JWST near-infrared exoplanet
transmission-spectroscopy dataset catalogue.

Runs the dataset_builder/ pipeline in order (query -> filter -> catalogue ->
write -> summary) and produces dataset_catalogue.csv and dataset_files.csv. No
FITS data is downloaded. See README.md for why the query uses
dataproduct_type="timeseries" rather than "spectrum".

Run with:  python app.py
"""

import sys
import pandas as pd
from astroquery.mast import Observations

from dataset_builder import (
    config, api_call, filtering, catalogue, summary, write_csv,
)


def main():
    Observations.TIMEOUT = 120

    # SET A: JWST near-infrared time-series spectroscopy.
    jwst_obs = api_call.query_jwst_nir_timeseries()
    if jwst_obs.empty:
        print("ERROR: the JWST query returned nothing. Aborting so we don't "
              "write empty CSVs.", file=sys.stderr)
        sys.exit(1)

    # SET B: HLSP science-ready spectra for the same targets.
    hlsp_obs = api_call.query_hlsp_for_targets(
        jwst_obs["target_name"].dropna().unique())

    # Product lists, filtered to science-ready calibrated spectra.
    jwst_files = filtering.get_science_products(jwst_obs, "JWST")
    hlsp_files = filtering.get_science_products(hlsp_obs, "HLSP")

    # Build the two output tables.
    cat = pd.concat([
        catalogue.build_catalogue_rows(jwst_obs, "JWST"),
        catalogue.build_catalogue_rows(hlsp_obs, "HLSP"),
    ], ignore_index=True)
    files = pd.concat([
        catalogue.build_file_rows(jwst_files, "JWST"),
        catalogue.build_file_rows(hlsp_files, "HLSP"),
    ], ignore_index=True)

    # Write the CSVs (resilient to the files being open in Excel).
    write_csv.safe_to_csv(cat, config.CATALOGUE_CSV)
    write_csv.safe_to_csv(files, config.FILES_CSV)
    print(f"\nWrote {config.CATALOGUE_CSV}  ({len(cat)} rows)")
    print(f"Wrote {config.FILES_CSV}  ({len(files)} rows)")

    summary.print_summary(cat, files)

    # Downloading is OFF by default -- see dataset_builder/07_download.py.


if __name__ == "__main__":
    main()
