#!/usr/bin/env python3
"""
build_dataset.py
================
Define and catalogue the JWST near-infrared exoplanet transmission-spectroscopy
dataset used by the technosignature-gas machine-learning pipeline.

The script makes TWO clearly separated queries against the MAST archive and
writes TWO CSV files. It does NOT download any FITS data (see task 7) -- it only
builds a metadata catalogue and prints a volume summary.

  SET A  ("JWST")  : the raw mission archive time-series observations.
  SET B  ("HLSP")  : High Level Science Products -- science-ready, already
                     reduced transmission spectra for the same targets.

Outputs (small text files, safe to commit):
  dataset_catalogue.csv : one row per observation.
  dataset_files.csv     : one row per downloadable science file.

--------------------------------------------------------------------------------
IMPORTANT FIELD NOTE  (verified against the LIVE MAST service in June 2026)
--------------------------------------------------------------------------------
The task asked for "data product type = spectrum" AND "time-series / transit".
When checked against the live astroquery field list, these turn out to be in
direct conflict, so the behaviour below is deliberate, not a guess:

  * MAST's CAOM schema has NO 'observing mode' / 'template' / 'time-series'
    field. The only time-related fields that exist are t_min, t_max and
    t_exptime (exposure timing only -- not a TSO-mode flag).

  * JWST transit / time-series observations are labelled
            dataproduct_type == "timeseries"
    and NOT "spectrum". Verified on the textbook transiting exoplanet WASP-39:
    it returns 24 "timeseries" products and ZERO "spectrum" products.

  * dataproduct_type == "spectrum" returns ~175k NIRSpec/MSA *survey* spectra
    that are not transits. Filtering on "spectrum" would therefore EXCLUDE the
    entire dataset we actually want.

Conclusion: the correct time-series-mode selector is dataproduct_type ==
"timeseries", restricted to the near-infrared SPECTROSCOPIC instrument modes
below. This is documented again in README.md.
"""

import sys
import time
import pandas as pd
from astroquery.mast import Observations
from astropy.time import Time

# ============================================================================
# CONFIGURATION  -- every field name below was verified to exist in the live
# Observations.get_metadata("observations") field list.
# ============================================================================

# Near-infrared SPECTROSCOPIC time-series instrument modes.
# These are the verified live instrument_name values returned for
# dataproduct_type="timeseries":
#     NIRSPEC/SLIT  -> NIRSpec Bright Object Time Series (BOTS), fixed slit
#     NIRISS/SOSS   -> NIRISS Single-Object Slitless Spectroscopy
#     NIRCAM/GRISM  -> NIRCam Grism Time Series
# Deliberately EXCLUDED, with reasons:
#     NIRCAM/IMAGE             -> photometric time series, not spectroscopy
#     NIRSPEC/MSA, NIRSPEC/IFU -> survey / IFU spectroscopy, not transit TSO
#     MIRI/*                   -> mid-infrared, outside the near-infrared scope
NIR_TSO_MODES = ["NIRSPEC/SLIT", "NIRISS/SOSS", "NIRCAM/GRISM"]

# The time-series-mode selector (see the IMPORTANT FIELD NOTE above).
TIMESERIES_TYPE = "timeseries"

# For HLSP we accept both labels, because reduced spectra are sometimes
# delivered tagged as "spectrum" and sometimes as "timeseries".
HLSP_PRODUCT_TYPES = ["spectrum", "timeseries"]

# Output file names (written into the current folder).
CATALOGUE_CSV = "dataset_catalogue.csv"
FILES_CSV = "dataset_files.csv"

# Product-list batching. get_product_list is happiest with modest batches.
PRODUCT_BATCH = 100


# ============================================================================
# SMALL HELPERS
# ============================================================================

def mjd_to_isodate(mjd):
    """Convert a Modified Julian Date (how MAST stores dates) to a plain
    YYYY-MM-DD string. Returns '' for missing / masked values."""
    try:
        if mjd is None or pd.isna(mjd):
            return ""
        return Time(float(mjd), format="mjd").isot[:10]
    except Exception:
        return ""


def human_mode(instrument_name):
    """Map a MAST instrument_name to a plain-English observing mode label,
    since MAST itself has no observing-mode field."""
    mode_map = {
        "NIRSPEC/SLIT": "NIRSpec BOTS (Bright Object Time Series)",
        "NIRISS/SOSS": "NIRISS SOSS (Single-Object Slitless Spectroscopy)",
        "NIRCAM/GRISM": "NIRCam Grism Time Series",
    }
    return mode_map.get(str(instrument_name), str(instrument_name))


def to_dataframe(table):
    """Convert an astropy Table to a pandas DataFrame, or an empty frame."""
    if table is None or len(table) == 0:
        return pd.DataFrame()
    return table.to_pandas()


def safe_to_csv(df, path, retries=30, wait=3):
    """Write a DataFrame to CSV, retrying if the file is locked.

    On Windows a CSV that is open in Excel (or being synced by OneDrive) is
    locked for writing. Rather than crash after a long query, we retry for a
    while and print a clear instruction so the user can just close the file."""
    for attempt in range(retries):
        try:
            df.to_csv(path, index=False)
            return
        except PermissionError:
            if attempt == 0:
                print(f"\n  >>> '{path}' is LOCKED (is it open in Excel?). "
                      f"Please close it; retrying for ~{retries * wait}s ...")
            time.sleep(wait)
    # Final attempt -- let the real error surface if it is still locked.
    df.to_csv(path, index=False)


# ============================================================================
# STEP 1 + 2 -- QUERY THE OBSERVATIONS (the two sets)
# ============================================================================

def query_jwst_nir_timeseries():
    """SET A: JWST mission archive, near-infrared spectroscopic time-series
    (i.e. transit / transmission) observations."""
    print("\n[SET A] Querying JWST near-infrared time-series spectroscopy ...")
    obs = Observations.query_criteria(
        obs_collection="JWST",
        dataproduct_type=TIMESERIES_TYPE,      # the verified TSO selector
        instrument_name=NIR_TSO_MODES,         # NIR spectroscopic modes only
        intentType="science",                  # drop pure calibration exposures
    )
    print(f"[SET A] JWST observations returned: {len(obs)}")
    return obs


def query_hlsp_for_targets(target_names):
    """SET B: High Level Science Products (already-reduced spectra) for the
    SAME targets found in SET A. Matched by EXACT target name.

    NOTE on matching (learned from the live service): MAST rejects a filter
    that contains more than one wildcard ("Only one wildcarded value may be
    used per filter, all others must be exact"). So we cannot pass a list of
    'NAME*' patterns. We instead pass a list of EXACT target names, which MAST
    treats as an OR of exact matches. The trade-off: target-name variants
    (e.g. 'WASP-39' vs 'WASP-39 b') will not be matched, which is acceptable
    here -- see the HONEST CAVEAT printed in the summary about what HLSP
    actually contains for these targets."""
    print("\n[SET B] Querying HLSP science-ready spectra for the same targets ...")
    if target_names is None or len(target_names) == 0:
        print("[SET B] No targets to look up -- skipping HLSP query.")
        return None

    # Unique, cleaned, EXACT target names (no wildcards -- see note above).
    names = sorted({str(t).strip() for t in target_names if str(t).strip()})

    collected = []
    for i in range(0, len(names), 50):              # batch to keep URLs short
        batch = names[i:i + 50]
        try:
            tbl = Observations.query_criteria(
                obs_collection="HLSP",
                dataproduct_type=HLSP_PRODUCT_TYPES,
                target_name=batch,                  # list of EXACT names = OR
            )
            if tbl is not None and len(tbl):
                collected.append(tbl.to_pandas())
        except Exception as exc:
            print(f"[SET B] HLSP batch {i // 50} failed ({exc!r}) -- continuing.")

    if not collected:
        print("[SET B] No HLSP products found for these targets.")
        return None

    hlsp = pd.concat(collected, ignore_index=True).drop_duplicates(subset="obsid")
    print(f"[SET B] HLSP observations returned: {len(hlsp)}")
    prov = hlsp["provenance_name"].value_counts().to_dict()
    inst = hlsp["instrument_name"].value_counts().to_dict()
    print(f"[SET B] HLSP provenance: {prov}")
    print(f"[SET B] HLSP instruments: {inst}")
    return hlsp


# ============================================================================
# STEP 5 -- GET PRODUCT FILE LISTS AND KEEP ONLY SCIENCE-READY SPECTRA
# ============================================================================

# Calibrated 1-D spectral product groups for JWST time-series data:
#   X1DINTS -> extracted 1-D spectrum per integration (the core TSO product)
#   X1D     -> extracted 1-D spectrum
#   WHTLT   -> white-light time-series curve
JWST_SPECTRAL_SUBGROUPS = {"X1DINTS", "X1D", "WHTLT"}


def get_science_products(obs_df, set_label):
    """Fetch the product list for a set of observations and filter it down to
    science-ready calibrated spectra (skipping raw level-1 and intermediate
    products). Returns a pandas DataFrame, one row per kept file."""
    if obs_df is None or len(obs_df) == 0:
        return pd.DataFrame()

    print(f"\n[{set_label}] Fetching product lists for {len(obs_df)} observations ...")

    # get_product_list accepts the obsid values; batch to be polite to MAST.
    obsids = [str(x) for x in obs_df["obsid"].tolist()]
    product_frames = []
    for i in range(0, len(obsids), PRODUCT_BATCH):
        batch = obsids[i:i + PRODUCT_BATCH]
        try:
            prods = Observations.get_product_list(batch)
            if prods is not None and len(prods):
                product_frames.append(prods.to_pandas())
        except Exception as exc:
            print(f"[{set_label}] product batch {i // PRODUCT_BATCH} failed "
                  f"({exc!r}) -- continuing.")

    if not product_frames:
        print(f"[{set_label}] No products returned.")
        return pd.DataFrame()

    prods = pd.concat(product_frames, ignore_index=True)
    print(f"[{set_label}] Raw products returned: {len(prods)}")

    # --- Filter to science-ready calibrated products -----------------------
    # Step a: keep only SCIENCE products at calibration level >= 2.
    #         (level 1 = raw '_uncal', level -1 = not-yet-public placeholders.)
    before = len(prods)
    keep = prods[
        (prods["productType"] == "SCIENCE")
        & (pd.to_numeric(prods["calib_level"], errors="coerce") >= 2)
    ].copy()

    # Step b: keep only the spectral products.
    #   * JWST set: restrict to the calibrated 1-D spectral subgroups.
    #   * HLSP set: products are already reduced spectra, so keep them all
    #     (we only dropped previews/auxiliary in step a).
    if set_label == "JWST":
        sub = keep["productSubGroupDescription"].astype(str).str.upper()
        seen = sorted(set(sub))
        keep = keep[sub.isin(JWST_SPECTRAL_SUBGROUPS)].copy()
        print(f"[{set_label}] product subgroups seen: {seen}")
        print(f"[{set_label}] keeping spectral subgroups: "
              f"{sorted(JWST_SPECTRAL_SUBGROUPS)}")

    print(f"[{set_label}] Science-ready spectra kept: {len(keep)} "
          f"(filtered out {before - len(keep)})")
    return keep


# ============================================================================
# STEP 6 -- SHAPE THE TWO OUTPUT CSV FILES
# ============================================================================

def build_catalogue_rows(obs_df, set_label):
    """One row per observation, with the columns requested in task 6."""
    if obs_df is None or len(obs_df) == 0:
        return pd.DataFrame()

    out = pd.DataFrame({
        "set": set_label,
        "target_name": obs_df.get("target_name"),
        "instrument": obs_df.get("instrument_name"),
        "provenance": obs_df.get("provenance_name"),   # e.g. CALJWST, OWLS, MUSCLES
        "filters_grating": obs_df.get("filters"),
        "observation_mode": obs_df.get("instrument_name").map(human_mode),
        "exposure_time_s": obs_df.get("t_exptime"),
        "proposal_id": obs_df.get("proposal_id"),
        "proposal_pi": obs_df.get("proposal_pi"),
        "release_date": obs_df.get("t_obs_release").map(mjd_to_isodate),
        "obs_id": obs_df.get("obs_id"),        # stable mission identifier
        "obsid": obs_df.get("obsid"),          # numeric id (used to join files)
        "calib_level": obs_df.get("calib_level"),
        "wavelength_region": obs_df.get("wavelength_region"),
    })
    return out


def build_file_rows(prod_df, set_label):
    """One row per downloadable file, with the columns requested in task 6."""
    if prod_df is None or len(prod_df) == 0:
        return pd.DataFrame()

    # The product table links back to an observation via 'parent_obsid'
    # (fall back to 'obsID' on older astroquery versions).
    parent = prod_df["parent_obsid"] if "parent_obsid" in prod_df.columns \
        else prod_df.get("obsID")

    out = pd.DataFrame({
        "set": set_label,
        "file_name": prod_df.get("productFilename"),
        "product_type": prod_df.get("productType"),
        "product_subgroup": prod_df.get("productSubGroupDescription"),
        "calib_level": prod_df.get("calib_level"),
        "size_bytes": pd.to_numeric(prod_df.get("size"), errors="coerce"),
        "data_uri": prod_df.get("dataURI"),    # MAST URI used to fetch the file
        "parent_obsid": parent,                # join key back to the catalogue
    })
    return out


# ============================================================================
# STEP 7 -- CONSOLE SUMMARY (no downloads)
# ============================================================================

def print_summary(catalogue, files):
    """Print the dataset summary: unique planets, observation count, and total
    data volume in GB broken down by instrument."""
    print("\n" + "=" * 70)
    print("DATASET SUMMARY  (metadata only -- nothing downloaded)")
    print("=" * 70)

    if catalogue.empty:
        print("No observations catalogued.")
        return

    for set_label in catalogue["set"].unique():
        cat = catalogue[catalogue["set"] == set_label]
        n_planets = cat["target_name"].nunique()
        n_obs = len(cat)
        print(f"\n[{set_label}]")
        print(f"  Unique planets/targets : {n_planets}")
        print(f"  Observations           : {n_obs}")

        # Attribute file volume to instruments by joining files -> catalogue.
        f = files[files["set"] == set_label]
        if not f.empty:
            merged = f.merge(
                cat[["obsid", "instrument"]],
                left_on="parent_obsid", right_on="obsid", how="left",
            )
            total_gb = merged["size_bytes"].fillna(0).sum() / 1e9
            print(f"  Science files          : {len(f)}")
            print(f"  Total data volume      : {total_gb:.2f} GB")
            by_inst = (merged.groupby("instrument")["size_bytes"]
                       .sum().fillna(0) / 1e9).sort_values(ascending=False)
            print("  Volume by instrument:")
            for inst, gb in by_inst.items():
                print(f"      {str(inst):<16} {gb:8.2f} GB")
        else:
            print("  Science files          : 0")

        # Provenance breakdown + honest note for the HLSP set.
        if set_label == "HLSP":
            prov = cat["provenance"].value_counts().to_dict()
            print(f"  Provenance breakdown   : {prov}")
            print("  NOTE: matched HLSP entries for these targets are "
                  "ground-based / multi-mission")
            print("        HOST-STAR libraries (e.g. OWLS = APO/ARCES echelle, "
                  "MUSCLES = UV-optical")
            print("        stellar SEDs) -- NOT JWST planet transmission "
                  "spectra. As of this run,")
            print("        MAST CAOM has no JWST reduced transmission-spectrum "
                  "HLSPs catalogued")
            print("        under these target names. Treat SET B as host-star "
                  "context, not")
            print("        as pipeline-ready planet spectra. See README.md.")

    print("\n" + "-" * 70)
    print("SCOPE NOTES (so nothing is implied silently):")
    print(" * MAST has no field that separates TRANSMISSION (transit) from")
    print("   EMISSION (eclipse) or phase-curve time series -- they share the")
    print("   same instrument modes. SET A is therefore all NIR time-series")
    print("   SPECTROSCOPY; isolating pure transits needs an external transit")
    print("   ephemeris / planet list (out of scope for an archive query).")
    print(" * SET A also includes some non-transiting targets that use the same")
    print("   modes (brown dwarfs, directly-imaged companions) and a few flux/")
    print("   calibration standard stars. Filter with a planet catalogue if you")
    print("   need transiting exoplanets only.")
    print("-" * 70)
    print("\n" + "=" * 70)


# ============================================================================
# STEP 7 (continued) -- OPTIONAL DOWNLOAD FUNCTION
# ============================================================================
# This is intentionally NOT called anywhere. The dataset is 50-200 GB, so
# downloading is a separate, deliberate step. To actually fetch the files
# later, uncomment the call in main() and point download_dir at a location
# that is OUTSIDE the git repo (or one of the ignored data/ folders).
#
# def download_products(files_df, download_dir="data", flat=True):
#     """Download every file listed in files_df via its MAST data URI.
#     WARNING: this can pull tens to hundreds of GB. Make sure download_dir
#     is git-ignored (see .gitignore)."""
#     from astroquery.mast import Observations
#     uris = files_df["data_uri"].dropna().unique().tolist()
#     print(f"Downloading {len(uris)} files into {download_dir}/ ...")
#     manifest = Observations.download_products(
#         uris, download_dir=download_dir, flat=flat,
#     )
#     return manifest


# ============================================================================
# MAIN
# ============================================================================

def main():
    # Be explicit about the archive we are hitting.
    Observations.TIMEOUT = 120

    # ---- SET A: JWST near-infrared time-series spectroscopy ---------------
    jwst_obs = to_dataframe(query_jwst_nir_timeseries())
    if jwst_obs.empty:
        print("ERROR: the JWST query returned nothing. Aborting so we don't "
              "write empty CSVs.", file=sys.stderr)
        sys.exit(1)

    # ---- SET B: HLSP science-ready spectra for the SAME targets -----------
    hlsp_obs = query_hlsp_for_targets(jwst_obs["target_name"].dropna().unique())

    # ---- Product lists, filtered to science-ready calibrated spectra ------
    jwst_files = get_science_products(jwst_obs, "JWST")
    hlsp_files = get_science_products(hlsp_obs, "HLSP")

    # ---- Build the two catalogues -----------------------------------------
    catalogue = pd.concat([
        build_catalogue_rows(jwst_obs, "JWST"),
        build_catalogue_rows(hlsp_obs, "HLSP"),
    ], ignore_index=True)

    files = pd.concat([
        build_file_rows(jwst_files, "JWST"),
        build_file_rows(hlsp_files, "HLSP"),
    ], ignore_index=True)

    # ---- Write the CSVs (resilient to the files being open in Excel) ------
    safe_to_csv(catalogue, CATALOGUE_CSV)
    safe_to_csv(files, FILES_CSV)
    print(f"\nWrote {CATALOGUE_CSV}  ({len(catalogue)} rows)")
    print(f"Wrote {FILES_CSV}  ({len(files)} rows)")

    # ---- Summary -----------------------------------------------------------
    print_summary(catalogue, files)

    # ---- Downloading is OFF by default (see download_products above) ------
    # download_products(files)   # <-- uncomment to actually fetch the FITS data


if __name__ == "__main__":
    main()
