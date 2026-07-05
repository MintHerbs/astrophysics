#!/usr/bin/env python3
"""
download_mast_products.py
=========================
Download JWST MIRI LRS calibrated 1-D spectral products (X1DINTS FITS) for
chosen targets from the inventory in mast_miri_inventory.csv, into
data/MAST/raw/. This is a deliberate, per-target fetch of large raw products,
kept separate from the lightweight inventory build.

Why this is opt-in and per-target
----------------------------------
X1DINTS products are the full per-integration time series, not a reduced
transmission spectrum. They are large: a single MIRI LRS time-series observation
runs from a few hundred megabytes to several gigabytes, and the whole inventory
would be hundreds of gigabytes to about a terabyte. Nothing is downloaded unless
you name a target (or pass --all --yes). Downloaded files are git-ignored.

Usage
-----
    # List the science target names available in the inventory
    python data/MAST/download_mast_products.py --list

    # Report the download size for one or more targets without downloading
    python data/MAST/download_mast_products.py WASP-107 --dry-run

    # Download the X1DINTS products for named targets into data/MAST/raw/
    python data/MAST/download_mast_products.py WASP-107 WASP-43

    # Download everything (guarded: requires --yes because of the ~TB scale)
    python data/MAST/download_mast_products.py --all --yes

Target names are matched against the `target_name` column exactly
(case-insensitive). Use --list to see them.
"""

from __future__ import annotations

import argparse
import os
import sys

import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
INVENTORY_CSV = os.path.join(HERE, "mast_miri_inventory.csv")
RAW_DIR = os.path.join(HERE, "raw")

# Calibrated 1-D spectral time-series product. X1DINTS is the extracted 1-D
# spectrum per integration; X1D is the combined 1-D spectrum where present.
DEFAULT_SUBGROUPS = ["X1DINTS"]

# Guardrail: refuse an unguarded bulk download beyond this many gigabytes.
BULK_WARN_GB = 20.0


def load_inventory():
    if not os.path.exists(INVENTORY_CSV):
        sys.exit(f"Inventory not found: {INVENTORY_CSV}. Run "
                 f"fetch_mast_miri_inventory.py first.")
    return pd.read_csv(INVENTORY_CSV)


def select_rows(inv, targets, include_all):
    """Return inventory rows for the requested targets."""
    if include_all:
        return inv.copy()
    wanted = {t.strip().lower() for t in targets}
    mask = inv["target_name"].astype(str).str.lower().isin(wanted)
    return inv[mask].copy()


def science_x1d_products(obsids, subgroups):
    """Fetch product lists for the given obsids and keep only SCIENCE X1D
    products at calibration level 2 or higher."""
    from astroquery.mast import Observations

    frames = []
    for obsid in obsids:
        try:
            pl = Observations.get_product_list(str(obsid)).to_pandas()
        except Exception as exc:
            print(f"  product list for obsid {obsid} failed ({exc!r}); skipping.")
            continue
        sub = pl["productSubGroupDescription"].astype(str).str.upper()
        keep = pl[
            (pl["productType"] == "SCIENCE")
            & (pd.to_numeric(pl["calib_level"], errors="coerce") >= 2)
            & (sub.isin({s.upper() for s in subgroups}))
        ]
        if len(keep):
            frames.append(keep)
    if not frames:
        return pd.DataFrame()
    return pd.concat(frames, ignore_index=True)


def main(argv=None):
    ap = argparse.ArgumentParser(description="Download MIRI LRS X1DINTS products "
                                             "for chosen targets into data/MAST/raw/.")
    ap.add_argument("targets", nargs="*", help="target_name value(s) to download")
    ap.add_argument("--list", action="store_true", help="list science target names and exit")
    ap.add_argument("--all", action="store_true", help="select every target in the inventory")
    ap.add_argument("--yes", action="store_true", help="confirm a large (>%.0f GB) download" % BULK_WARN_GB)
    ap.add_argument("--dry-run", action="store_true", help="report sizes but download nothing")
    ap.add_argument("--subgroup", action="append", default=None,
                    help="product subgroup(s) to fetch (default: X1DINTS)")
    args = ap.parse_args(argv)

    inv = load_inventory()
    subgroups = args.subgroup if args.subgroup else DEFAULT_SUBGROUPS

    if args.list:
        sci = inv[~inv["is_background_or_calibration"]]
        names = sorted(sci["target_name"].astype(str).unique())
        print(f"{len(names)} science target names in the inventory:")
        for n in names:
            print(f"  {n}")
        return 0

    if not args.targets and not args.all:
        ap.print_usage()
        print("\nName at least one target, or use --all --yes. "
              "Use --list to see target names.")
        return 2

    rows = select_rows(inv, args.targets, args.all)
    if len(rows) == 0:
        print("No inventory rows matched the requested target(s). "
              "Use --list to see available names.")
        return 1

    obsids = rows["obsid"].tolist()
    print(f"Matched {len(rows)} observation(s) across "
          f"{rows['target_name'].nunique()} target name(s).")
    print("Fetching product lists ...")
    products = science_x1d_products(obsids, subgroups)
    if len(products) == 0:
        print("No matching SCIENCE products found for the selected observations.")
        return 1

    total_gb = pd.to_numeric(products["size"], errors="coerce").sum() / 1e9
    print(f"{len(products)} product file(s), {total_gb:.2f} GB total "
          f"(subgroups: {subgroups}).")

    if args.dry_run:
        print("Dry run: nothing downloaded.")
        return 0

    if total_gb > BULK_WARN_GB and not args.yes:
        print(f"This download is {total_gb:.1f} GB (> {BULK_WARN_GB:.0f} GB). "
              f"Re-run with --yes to confirm.")
        return 2

    os.makedirs(RAW_DIR, exist_ok=True)
    from astroquery.mast import Observations
    from astropy.table import Table

    print(f"Downloading into {RAW_DIR} ...")
    manifest = Observations.download_products(
        Table.from_pandas(products), download_dir=RAW_DIR
    )
    ok = sum(1 for s in manifest["Status"] if str(s).upper() == "COMPLETE")
    print(f"Downloaded {ok}/{len(manifest)} files into {RAW_DIR}.")
    print("These raw products are git-ignored and must not be committed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
