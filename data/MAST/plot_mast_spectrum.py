#!/usr/bin/env python3
"""
plot_mast_spectrum.py
=====================
Plot the time-median extracted 1-D spectrum from the MIRI LRS X1DINTS products
downloaded into data/MAST/raw/.

What this shows, and what it is not
-----------------------------------
An X1DINTS file holds one extracted 1-D spectrum (FLUX versus WAVELENGTH) per
integration, stored as repeated EXTRACT1D extensions. This script stacks those
integrations and plots the median flux against wavelength for each observation.

That median is the extracted stellar flux spectrum, NOT a transmission spectrum.
A transmission spectrum (transit depth versus wavelength) is obtained by fitting
the transit light curve in each wavelength channel, which is a separate
reduction step this script does not perform. The plot is a sanity check that the
downloaded data are real and cover the MIRI band.

Usage
-----
    python data/MAST/plot_mast_spectrum.py

Reads the LRS slitless X1DINTS products in data/MAST/raw/ and writes one PNG per
observation into data/MAST/plots/. It also writes the numeric median spectra to
data/MAST/mast_median_spectra.csv (one row per observation and wavelength point,
columns observation, target, n_integrations, wavelength_um, median_flux) so the
same values can be read by other tools without re-parsing the FITS. Like the
plots, that CSV is a regenerable product of the git-ignored raw FITS and is not
committed; rebuild it locally by running this script.
"""

from __future__ import annotations

import csv
import glob
import os

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
RAW_DIR = os.path.join(HERE, "raw")
PLOTS_DIR = os.path.join(HERE, "plots")
MEDIAN_CSV = os.path.join(HERE, "mast_median_spectra.csv")

# Columns written to MEDIAN_CSV. Wavelength is in micrometres; median_flux keeps
# the native X1DINTS FLUX units (extracted flux, not a transmission depth).
MEDIAN_CSV_COLUMNS = ["observation", "target", "n_integrations",
                      "wavelength_um", "median_flux"]

# The LRS slitless spectral product carries this token in its filename; the
# per-segment "mirimage" files are the detector-level exposures and are skipped.
LRS_PRODUCT_TOKEN = "slitlessprism"

# Nominal usable MIRI LRS wavelength range, in micrometres, for a guide band.
LRS_USABLE_UM = (5.0, 12.0)


def find_lrs_x1dints():
    pattern = os.path.join(RAW_DIR, "**", "*x1dints.fits")
    files = [f for f in glob.glob(pattern, recursive=True)
             if LRS_PRODUCT_TOKEN in os.path.basename(f).lower()]
    return sorted(files)


def median_spectrum(path):
    """Return (wavelength_um, median_flux, n_integrations, target_name).

    An X1DINTS EXTRACT1D extension stores WAVELENGTH and FLUX as 2-D arrays of
    shape (n_integrations, n_wavelength); the wavelength grid is the same for
    every integration. Integrations are pooled across all EXTRACT1D extensions
    and the per-wavelength median flux is returned. Points flagged by the DQ
    array are masked before the median."""
    from astropy.io import fits

    flux_rows = []
    ref_wave = None
    target = None
    with fits.open(path) as hdul:
        hdr = hdul[0].header
        target = hdr.get("TARGPROP") or hdr.get("TARGNAME") or "unknown target"
        for hd in hdul:
            if hd.name != "EXTRACT1D" or hd.data is None:
                continue
            wave = np.atleast_2d(np.asarray(hd.data["WAVELENGTH"], dtype=float))
            flux = np.atleast_2d(np.asarray(hd.data["FLUX"], dtype=float))
            if "DQ" in hd.columns.names:
                dq = np.atleast_2d(np.asarray(hd.data["DQ"]))
                flux = np.where(dq == 0, flux, np.nan)
            if ref_wave is None:
                ref_wave = wave[0]
            if flux.shape[1] == ref_wave.shape[0]:
                flux_rows.append(flux)
    if ref_wave is None or not flux_rows:
        return None, None, 0, target
    stack = np.vstack(flux_rows)
    med = np.nanmedian(stack, axis=0)
    order = np.argsort(ref_wave)
    return ref_wave[order], med[order], stack.shape[0], target


def observation_id(path):
    """Stable observation label: the product file name without the FITS suffix.

    For jw01280-o001_t001_miri_p750l-slitlessprism_x1dints.fits this returns
    jw01280-o001_t001_miri_p750l-slitlessprism."""
    base = os.path.basename(path)
    stem = os.path.splitext(base)[0]
    return stem[:-len("_x1dints")] if stem.endswith("_x1dints") else stem


def plot_one(path, wave, med, n_int, target):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    base = os.path.basename(path)

    fig, ax = plt.subplots(figsize=(8, 4.5))
    ax.plot(wave, med, lw=0.9, color="#1f4e79")
    ax.axvspan(*LRS_USABLE_UM, color="#f0a500", alpha=0.10,
               label=f"nominal LRS band {LRS_USABLE_UM[0]}-{LRS_USABLE_UM[1]} um")
    ax.set_xlabel("Wavelength (micrometres)")
    ax.set_ylabel("Median extracted flux (X1DINTS FLUX)")
    ax.set_title(f"{target} - MIRI LRS median extracted spectrum\n"
                 f"({n_int} integrations pooled; not a transmission spectrum)")
    ax.legend(loc="best", fontsize=8)
    ax.grid(alpha=0.3)
    fig.tight_layout()
    out = os.path.join(PLOTS_DIR, os.path.splitext(base)[0] + "_median.png")
    fig.savefig(out, dpi=130)
    plt.close(fig)
    print(f"  {base}: {target}, {n_int} integrations, {len(wave)} wavelength "
          f"points -> {out}")
    return out


def write_median_csv(records):
    """Write the pooled median spectra to MEDIAN_CSV.

    records is a list of (observation, target, n_int, wave, med) tuples. One CSV
    row is written per observation and wavelength point. The file is always
    (re)written, with a header only when there are no records, so downstream
    tools see a consistent, if empty, table."""
    with open(MEDIAN_CSV, "w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh)
        writer.writerow(MEDIAN_CSV_COLUMNS)
        for observation, target, n_int, wave, med in records:
            for wl, fl in zip(wave, med):
                if np.isfinite(wl) and np.isfinite(fl):
                    writer.writerow([observation, target, n_int,
                                     f"{float(wl):.6f}", f"{float(fl):.6g}"])


def main():
    files = find_lrs_x1dints()
    if not files:
        print(f"No LRS slitless X1DINTS products found in {RAW_DIR}.")
        print("Download some first, for example: "
              "python data/MAST/download_mast_products.py WASP-107")
        # Write a header-only CSV so the output exists and is consistent.
        write_median_csv([])
        return 0
    os.makedirs(PLOTS_DIR, exist_ok=True)
    print(f"Plotting median spectra for {len(files)} LRS product(s) ...")
    made = []
    records = []
    for path in files:
        wave, med, n_int, target = median_spectrum(path)
        if wave is None:
            print(f"  {os.path.basename(path)}: no EXTRACT1D data found; skipping.")
            continue
        records.append((observation_id(path), target, n_int, wave, med))
        out = plot_one(path, wave, med, n_int, target)
        if out:
            made.append(out)
    write_median_csv(records)
    n_points = sum(len(w) for _, _, _, w, _ in records)
    print(f"Wrote {len(made)} plot(s) to {PLOTS_DIR}.")
    print(f"Wrote {n_points} median points from {len(records)} observation(s) "
          f"to {MEDIAN_CSV}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
