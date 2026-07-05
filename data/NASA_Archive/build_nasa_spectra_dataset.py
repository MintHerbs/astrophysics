#!/usr/bin/env python3
"""
build_nasa_spectra_dataset.py
=============================
Turn the downloaded NASA Exoplanet Archive MIRI transmission-spectrum files
(the .tbl files in data/NASA_Archive/raw/) into a single tidy, long-format CSV
and a plot per spectrum.

The Atmospheric Spectroscopy table serves the spectrum data files only through
its Firefly interface (there is no stable direct-download URL), so this script
does not fetch them. It reads whatever .tbl files you have placed in raw/. See
data/NASA_Archive/raw/README.md for the download steps.

Outputs
-------
- data/NASA_Archive/nasa_miri_spectra_points.csv : one row per spectral point,
  across all input files, with the source file and (where matched) the planet
  name and reference from nasa_miri_spectra.csv.
- data/NASA_Archive/plots/<file>.png : the spectrum from each input file.

The .tbl files are IPAC Table Format. Column names vary between references, so
the wavelength, depth and uncertainty columns are identified by name heuristics;
the columns actually found are printed for each file. If a file is not parsed
correctly, pass explicit column names with --wavelength-col / --depth-col /
--err-col.

Usage
-----
    python data/NASA_Archive/build_nasa_spectra_dataset.py
"""

from __future__ import annotations

import argparse
import glob
import os
import sys

import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
RAW_DIR = os.path.join(HERE, "raw")
PLOTS_DIR = os.path.join(HERE, "plots")
INVENTORY_CSV = os.path.join(HERE, "nasa_miri_spectra.csv")
POINTS_CSV = os.path.join(HERE, "nasa_miri_spectra_points.csv")

# Name fragments used to identify columns when they are not given explicitly.
WAVELENGTH_HINTS = ("wavelength", "wave", "lambda", "wavelng", "wl", "micron")
DEPTH_HINTS = ("depth", "transit", "rprs", "rp_rs", "rp/rs", "trandep", "flux",
               "ppm", "fp_fs", "dppm")
ERROR_HINTS = ("err", "unc", "sigma", "_e", "error")

POINTS_COLUMNS = [
    "source_file", "pl_name", "reference_bibcode", "note",
    "wavelength_um", "depth", "depth_err_low", "depth_err_high",
    "depth_column", "wavelength_column", "depth_unit", "wavelength_unit",
]


def read_ipac_table(path):
    """Read an IPAC-format .tbl into a pandas DataFrame, with fallbacks."""
    from astropy.io import ascii as apascii
    for fmt in ("ipac", "commented_header", "basic", None):
        try:
            t = apascii.read(path, format=fmt) if fmt else apascii.read(path)
            if len(t.colnames):
                return t.to_pandas(), t
        except Exception:
            continue
    return None, None


def pick_column(columns, hints, exclude=()):
    """First column whose lowercased name contains any hint, skipping excludes."""
    lowered = [(c, str(c).lower()) for c in columns]
    for c, lc in lowered:
        if c in exclude:
            continue
        if any(h in lc for h in hints):
            return c
    return None


def load_reference_maps():
    """Build two lookups from the inventory CSV to identify a downloaded file.

    by_filename: spec_path basename -> (pl_name, bibcode). This matches the
    archive-internal path recorded by the TAP query, which is not the file name
    the Firefly "Download All Checked Spectra" action actually gives you.

    by_pl_name_authors: (pl_name, authors) lower-cased -> bibcode. Every real
    per-spectrum .tbl downloaded this way carries PL_NAME and REFERENCE as IPAC
    header keywords (confirmed by inspecting a real download), and REFERENCE
    matches the inventory's authors column, so this is the reliable match.
    """
    if not os.path.exists(INVENTORY_CSV):
        return {}, {}
    inv = pd.read_csv(INVENTORY_CSV)
    by_filename = {}
    by_pl_name_authors = {}
    for _, r in inv.iterrows():
        sp = str(r.get("spec_path", "")).strip()
        pl_name = r.get("pl_name")
        bibcode = r.get("reference_bibcode")
        authors = r.get("authors")
        if sp:
            by_filename[os.path.basename(sp)] = (pl_name, bibcode)
        if pl_name and authors:
            by_pl_name_authors[(str(pl_name).strip().lower(), str(authors).strip().lower())] = bibcode
    return by_filename, by_pl_name_authors


def column_unit(tbl, col_name):
    """The unit recorded for a column in the IPAC units row, or None.

    Read from the astropy Table (not the pandas DataFrame), since the units
    row is only preserved there. Returns None if the table has no such column
    or no unit was recorded (units are optional in IPAC format).
    """
    if tbl is None or col_name not in getattr(tbl, "colnames", []):
        return None
    unit = tbl[col_name].unit
    return str(unit) if unit is not None else None


MICRON_UNIT_HINTS = ("micron", "um", "µm")


def ipac_keyword(tbl, name):
    """Read one IPAC header keyword's value, or None if absent or null."""
    if tbl is None:
        return None
    kw = tbl.meta.get("keywords", {}) if hasattr(tbl, "meta") else {}
    entry = kw.get(name)
    if not entry:
        return None
    value = str(entry.get("value", "")).strip()
    return value if value and value.lower() != "null" else None


def parse_file(path, refmaps, cols):
    """Parse one .tbl into a tidy DataFrame of points, plus a short summary."""
    by_filename, by_pl_name_authors = refmaps
    df, tbl = read_ipac_table(path)
    base = os.path.basename(path)
    if df is None or df.empty:
        print(f"  {base}: could not read any table rows; skipping.")
        return None

    wl_col = cols.get("wavelength") or pick_column(df.columns, WAVELENGTH_HINTS)
    depth_col = cols.get("depth") or pick_column(
        df.columns, DEPTH_HINTS, exclude={wl_col})
    if wl_col is None or depth_col is None:
        lowered = {str(c).lower() for c in df.columns}
        if {"spec_path", "bibcode", "pl_name"} & lowered:
            print(f"  {base}: this looks like the archive's spectrum inventory "
                  f"table (it has columns like spec_path/bibcode/pl_name), not "
                  f"an individual spectrum's data. Downloading or exporting the "
                  f"results table gives you this metadata; the wavelength and "
                  f"depth values come from a separate action. On the Atmospheric "
                  f"Spectroscopy page, check the rows you want and use "
                  f"'Download All Checked Spectra' (not a table export) to get "
                  f"the per-spectrum .tbl files.")
        else:
            print(f"  {base}: columns found {list(df.columns)}; could not identify "
                  f"wavelength/depth. Re-run with --wavelength-col/--depth-col.")
        return None

    err_col = cols.get("err") or pick_column(
        df.columns, ERROR_HINTS, exclude={wl_col, depth_col})

    wavelength_unit = column_unit(tbl, wl_col)
    depth_unit = column_unit(tbl, depth_col)
    if wavelength_unit and not any(h in wavelength_unit.lower() for h in MICRON_UNIT_HINTS):
        print(f"  {base}: warning: wavelength column '{wl_col}' is recorded in "
              f"'{wavelength_unit}', not micrometres; wavelength_um for this file "
              f"may be in the wrong unit.")

    kw_pl_name = ipac_keyword(tbl, "PL_NAME")
    kw_reference = ipac_keyword(tbl, "REFERENCE")
    kw_note = ipac_keyword(tbl, "NOTE")
    matched_by = None
    pl_name = bibcode = None
    if kw_pl_name and kw_reference:
        bibcode = by_pl_name_authors.get((kw_pl_name.strip().lower(), kw_reference.strip().lower()))
        if bibcode:
            pl_name = kw_pl_name
            matched_by = "embedded PL_NAME/REFERENCE keywords"
    if pl_name is None and base in by_filename:
        pl_name, bibcode = by_filename[base]
        matched_by = "file name matched to the inventory's spec_path"
    if pl_name is None and kw_pl_name:
        # The file identifies its own planet but no inventory row's authors
        # matched (for example a spectrum published after the inventory was
        # last fetched); keep the planet name so the spectrum is still labelled.
        pl_name = kw_pl_name
        matched_by = "embedded PL_NAME keyword only (no matching inventory reference)"

    # Several planets have more than one spectrum from the same paper (different
    # reduction pipelines), distinguished only by the inventory's note column.
    # The embedded NOTE keyword carries the same text, so it is passed through
    # here for the frontend to disambiguate which inventory row a file belongs
    # to; this script does not need to resolve that itself.
    note = kw_note

    out = pd.DataFrame({
        "source_file": base,
        "pl_name": pl_name,
        "reference_bibcode": bibcode,
        "note": note,
        "wavelength_um": pd.to_numeric(df[wl_col], errors="coerce"),
        "depth": pd.to_numeric(df[depth_col], errors="coerce"),
        "depth_err_low": pd.to_numeric(df[err_col], errors="coerce") if err_col else pd.NA,
        "depth_err_high": pd.to_numeric(df[err_col], errors="coerce") if err_col else pd.NA,
        "depth_column": depth_col,
        "wavelength_column": wl_col,
        "depth_unit": depth_unit,
        "wavelength_unit": wavelength_unit,
    }).dropna(subset=["wavelength_um", "depth"]).sort_values("wavelength_um")

    label = pl_name if pl_name else base
    match_note = f"; matched by {matched_by}" if matched_by else "; no planet/reference match found"
    print(f"  {base}: {len(out)} points; planet={label}; "
          f"wavelength='{wl_col}', depth='{depth_col}', err='{err_col}'{match_note}.")
    return out[POINTS_COLUMNS]


def plot_file(points, path_png):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    label = points["pl_name"].iloc[0] or points["source_file"].iloc[0]
    depth_col = points["depth_column"].iloc[0]
    fig, ax = plt.subplots(figsize=(8, 4.5))
    yerr = None
    if points["depth_err_low"].notna().any():
        yerr = points["depth_err_low"].to_numpy(dtype=float)
    ax.errorbar(points["wavelength_um"], points["depth"], yerr=yerr,
                fmt="o", ms=3, lw=1, capsize=2, color="#1f4e79")
    ax.set_xlabel("Wavelength (micrometres)")
    ax.set_ylabel(f"Transit depth ({depth_col})")
    ax.set_title(f"{label} - JWST MIRI transmission spectrum (NASA Exoplanet Archive)")
    ax.grid(alpha=0.3)
    fig.tight_layout()
    fig.savefig(path_png, dpi=130)
    plt.close(fig)


def main(argv=None):
    ap = argparse.ArgumentParser(description="Parse NASA MIRI .tbl spectra into a "
                                             "tidy CSV and plots.")
    ap.add_argument("--wavelength-col", default=None)
    ap.add_argument("--depth-col", default=None)
    ap.add_argument("--err-col", default=None)
    args = ap.parse_args(argv)
    cols = {"wavelength": args.wavelength_col, "depth": args.depth_col,
            "err": args.err_col}

    files = sorted(glob.glob(os.path.join(RAW_DIR, "*.tbl")))
    if not files:
        print(f"No .tbl files found in {RAW_DIR}.")
        print("Download the spectra first (see data/NASA_Archive/raw/README.md), "
              "then re-run.")
        # Write a header-only points CSV so the output exists and is consistent.
        pd.DataFrame(columns=POINTS_COLUMNS).to_csv(POINTS_CSV, index=False)
        return 0

    print(f"Reading {len(files)} .tbl file(s) from {RAW_DIR} ...")
    refmaps = load_reference_maps()
    os.makedirs(PLOTS_DIR, exist_ok=True)

    all_points = []
    for path in files:
        pts = parse_file(path, refmaps, cols)
        if pts is None or pts.empty:
            continue
        all_points.append(pts)
        png = os.path.join(PLOTS_DIR, os.path.splitext(os.path.basename(path))[0] + ".png")
        try:
            plot_file(pts, png)
        except Exception as exc:
            print(f"    plot failed for {os.path.basename(path)} ({exc!r}).")

    if not all_points:
        print("No files parsed successfully.")
        pd.DataFrame(columns=POINTS_COLUMNS).to_csv(POINTS_CSV, index=False)
        return 1

    combined = pd.concat(all_points, ignore_index=True)
    combined.to_csv(POINTS_CSV, index=False)
    n_planets = combined["pl_name"].nunique(dropna=True)
    print(f"\nWrote {len(combined)} spectral points from {len(all_points)} file(s) "
          f"({n_planets} named planets) to {POINTS_CSV}.")
    print(f"Plots written to {PLOTS_DIR}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
