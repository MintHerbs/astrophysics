# JWST MIRI Spectra Explorer (frontend)

A small, self-contained web app that displays the JWST MIRI transmission-spectroscopy dataset used
by this project, with a prominent toggle to switch the whole view between the two archive sources
(NASA Exoplanet Archive and MAST). It is a viewer for the real dataset only; it does not run the
science pipeline and it never fabricates data.

The app lives entirely in this `frontend/` folder. It reads the CSVs produced by the data-pipeline
scripts under [`../data`](../data), converts them to JSON with a data-prep step, and renders them.

## The two sources mean different things

The toggle swaps the data, the axis labels, and the caption, because the two sources are not the
same kind of measurement:

- **NASA Exoplanet Archive**: published, reduced transmission spectra. The y-axis is **transit
  depth**. This is a real transmission spectrum and the actual input to the technosignature and
  biosignature pipeline.
- **MAST**: a downloaded demo product (WASP-107). The y-axis is **median extracted flux**. This is
  raw extracted stellar flux, pooled over integrations, used only to sanity-check that the data are
  real and cover the MIRI band. It is **not** a transmission spectrum and not a science result.

The app makes this distinction obvious so the MAST demo is never mistaken for a result.

## Stack and library choices

- **Next.js (App Router) with TypeScript**: a clean, conventional, self-contained project.
- **Material Design 3 / Material You**: the tonal palette is generated from a single seed colour
  with `@material/material-color-utilities` (Google's official Material Color Utilities), emitted as
  `--md-sys-color-*` CSS custom properties for both light and dark. Shapes, tonal surfaces, the type
  scale, and a light/dark toggle follow MD3. Icons are Material Symbols. Fonts and icons are linked
  in the document head (not `next/font`), so the production build needs no network access.
- **Recharts** for the spectrograph, chosen because it supports **error bars** natively (used for
  the NASA transit-depth uncertainties) alongside reference areas and lines for the science-band
  annotations.

## Views

1. **Spectrograph**: the source toggle, a selector for the planet or observation within the active
   source, and a chart of the selected spectrum versus wavelength in micrometres. NASA spectra show
   1-sigma error bars. The chart annotates the science bands taken from the project docs: the
   technosignature target window (8.6 to 11.8 micrometres) and the ozone feature (near 9.6
   micrometres). The reference (bibcode) and source for the selected spectrum are shown below.
2. **Dataset overview**: summary counts (spectra, planets or targets, spectral points) and the
   planet or target list with references and wavelength coverage, for the active source.
3. **Data dictionary**: provenance for the active source plus each real CSV column with a
   plain-language description.

## Prerequisites

- Node.js 18.18 or newer (Node 20+ recommended).
- The dataset CSVs under `../data`. The NASA inventory and the MAST inventory are committed; the
  per-point spectra are produced by the pipeline scripts (see below). Either source may be empty:
  the app still builds and runs and shows a clear empty state with the exact commands to populate
  that source.

## Install, run, and build

From this `frontend/` folder:

```
npm install         # install dependencies
npm run dev         # start the dev server at http://localhost:3000
npm run build       # production build
npm start           # serve the production build
```

`npm run dev` and `npm run build` automatically run the data-prep step first (`predev` and
`prebuild`), so the JSON the app imports is always up to date with the CSVs.

## Data-prep step

The app reads only from generated JSON (`src/data/nasa.json` and `src/data/mast.json`). Regenerate it
at any time with:

```
npm run prepare-data
```

This reads the following real files and writes the two JSON files:

- `../data/NASA_Archive/nasa_miri_spectra.csv` (inventory, committed)
- `../data/NASA_Archive/nasa_miri_spectra_points.csv` (per-point spectra, produced locally)
- `../data/MAST/mast_median_spectra.csv` (median spectra, produced locally)
- `../data/MAST/mast_miri_inventory.csv` (inventory, committed, joined for provenance)

The generated JSON is not committed (see `.gitignore`); the CSVs are the record of truth.

## Populating an empty source

If a source shows an empty state, run the steps it lists. In short, from the repository root:

- **NASA points** (needed to plot NASA spectra): download the MIRI transmission `.tbl` files from the
  NASA Exoplanet Archive Atmospheric Spectroscopy (Firefly) interface into
  `data/NASA_Archive/raw/` (see [`../data/NASA_Archive/raw/README.md`](../data/NASA_Archive/raw/README.md)),
  then run `python data/NASA_Archive/build_nasa_spectra_dataset.py`.
- **MAST demo**: `python data/MAST/download_mast_products.py WASP-107` then
  `python data/MAST/plot_mast_spectrum.py`.

After either, run `npm run prepare-data` (or just start the dev server).

## Project layout

```
frontend/
  scripts/prepare-data.mjs   data-prep: CSV -> JSON (run by npm)
  src/
    app/                     Next.js App Router (layout, page, global styles)
    components/              UI components (toggle, tabs, chart, views)
    data/                    generated JSON (git-ignored)
    lib/                     theme, types, data access, content, science bands, formatting
```

## Notes

- The app fabricates nothing. Spectra, planet and target names, wavelengths, and values come solely
  from the generated JSON, which comes solely from the CSVs. Explanatory copy and the science-band
  values (which are taken verbatim from the project docs) are the only static text.
- The seed colour for the Material You palette is set in `src/lib/theme.ts`; change that one value to
  retheme the whole app.
