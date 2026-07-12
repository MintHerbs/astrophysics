/**
 * Central path resolution for the local, filesystem-backed API routes.
 *
 * This module and everything under src/lib/server and src/app/api runs only on
 * the Node server process behind `npm run dev` / `npm start`, never in the
 * browser. It reads and writes the real dataset under ../data and invokes the
 * existing Python pipeline scripts there; it is a thin local control surface
 * over those scripts, not a replacement for them.
 */

import path from "node:path";

export const FRONTEND_DIR = path.resolve(process.cwd());
export const REPO_ROOT = path.resolve(FRONTEND_DIR, "..");
export const DATA_DIR = path.join(REPO_ROOT, "data");

export const NASA_DIR = path.join(DATA_DIR, "NASA_Archive");
export const NASA_RAW_DIR = path.join(NASA_DIR, "raw");
export const NASA_BUILD_SCRIPT = path.join(NASA_DIR, "build_nasa_spectra_dataset.py");

/**
 * Local archive dump: a Firefly export of the Atmospheric Spectroscopy table
 * (spectra.csv) alongside the per-spectrum .tbl files it references, placed
 * directly under NASA_DIR (not the raw/ upload folder above). This is the
 * single NASA catalogue the frontend reads: the built dataset (buildNasa) and
 * the raw Dataset tab (/api/dataset/raw) both use it, and each spectrum's
 * points are parsed from its .tbl file on every request rather than pre-built
 * into a CSV.
 *
 * Note: the standalone Python pipeline (fetch_nasa_miri_spectra.py and
 * build_nasa_spectra_dataset.py) maintains a separate programmatic inventory,
 * nasa_miri_spectra.csv, and a nasa_miri_spectra_points.csv. The frontend does
 * not read those; it is driven entirely by spectra.csv plus the .tbl files.
 */
export const NASA_SPECTRA_CSV = path.join(NASA_DIR, "spectra.csv");

export const MAST_DIR = path.join(DATA_DIR, "MAST");
export const MAST_INVENTORY_CSV = path.join(MAST_DIR, "mast_miri_inventory.csv");
export const MAST_MEDIAN_CSV = path.join(MAST_DIR, "mast_median_spectra.csv");
export const MAST_RAW_DIR = path.join(MAST_DIR, "raw");
export const MAST_DOWNLOAD_SCRIPT = path.join(MAST_DIR, "download_mast_products.py");
export const MAST_PLOT_SCRIPT = path.join(MAST_DIR, "plot_mast_spectrum.py");
