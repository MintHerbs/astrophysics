# JWST MIRI Spectra Explorer (frontend)

A small, self-contained web app that displays the JWST MIRI transmission-spectroscopy dataset used
by this project, with a prominent toggle to switch the whole view between the two archive sources
(NASA Exoplanet Archive and MAST). It also lets you populate either source from inside the app: a
searchable picker downloads real MAST observations on demand, and a drop zone runs the NASA build
step on files you fetch from the archive by hand. It is a viewer and a local control surface for the
existing data-pipeline scripts; it does not run the science pipeline itself and it never fabricates
data.

The app lives entirely in this `frontend/` folder. Its API routes read the CSVs under
[`../data`](../data) live, on every request, and can invoke the existing Python scripts there
(`download_mast_products.py`, `plot_mast_spectrum.py`, `build_nasa_spectra_dataset.py`) in response to
button clicks.

**This is a local developer tool, not a public web app.** Its API routes write files under `../data`
and spawn local Python processes without any authentication. That is appropriate for `npm run dev` or
`npm start` on your own machine, and unsafe to deploy on the open internet as-is.

## The two sources mean different things

The toggle swaps the data, the axis labels, and the caption, because the two sources are not the
same kind of measurement:

- **NASA Exoplanet Archive**: published, reduced transmission spectra. The y-axis is **transit
  depth**. This is a real transmission spectrum and the actual input to the technosignature and
  biosignature pipeline.
- **MAST**: downloaded demo products. The y-axis is **median extracted flux**. This is raw extracted
  stellar flux, pooled over integrations, used only to sanity-check that the data are real and cover
  the MIRI band. It is **not** a transmission spectrum and not a science result.

The app makes this distinction obvious so a MAST demo is never mistaken for a result.

## Stack and library choices

- **Next.js (App Router) with TypeScript**: the App Router's route handlers double as a small local
  backend (see below), alongside the client UI, in one project.
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
   micrometres). The reference (bibcode) and source for the selected spectrum are shown below, along
   with the population panel for that source (see below).
2. **Dataset overview**: summary counts (spectra, planets or targets, spectral points) and the
   planet or target list with references and wavelength coverage, for the active source.
3. **Data dictionary**: provenance for the active source plus each real CSV column with a
   plain-language description.

## Populating data from inside the app

### MAST: fully automatic

MAST has a real programmatic API (`astroquery`), so the picker is a complete, no-terminal flow:

1. Open the "Browse MAST observations" panel in the Spectrograph tab. It lists every real MIRI LRS
   target from `mast_miri_inventory.csv`, searchable by name.
2. Click **Check size** for a target. This runs the existing downloader's `--dry-run` mode and shows
   the real size and file count; nothing is downloaded yet.
3. Click **Download**. This downloads the X1DINTS product(s) for that target, builds its median
   spectrum, and refreshes the chart automatically.

The "MAST-classified exoplanet targets only" checkbox filters by MAST's own `target_classification`
field, which is not always populated for known exoplanet hosts (for example WASP-107 is classified
only as "Star; K dwarfs; K stars" in this inventory) -- it is off by default for that reason. Search
by name to find a specific target regardless of its classification.

### NASA: the archive step is manual, everything after it is not

The NASA Exoplanet Archive serves its per-spectrum `.tbl` files only through a session-based browser
interface (Firefly) with no stable, scriptable download URL -- this is confirmed in the archive's own
documentation and recorded in
[`../data/NASA_Archive/raw/README.md`](../data/NASA_Archive/raw/README.md). There is no honest way to
automate that one step from a server. What the app automates is everything around it:

1. Open the "Find a spectrum in the archive" panel and search for a planet. Its **Open in archive**
   link jumps straight to that planet's page on the archive, pre-filtered to its spectra (the same
   `?atmospheres&planet='<name>'` link the archive's own per-planet Overview pages use; a plain
   search link is also available as a fallback in the "Populate NASA spectra" panel below it).
2. On the archive, check the row(s) you want and use "Download All Checked Spectra" (keep IPAC Table
   Format, `.tbl`).
3. Drag the downloaded `.tbl` files into the drop zone in the "Populate NASA spectra" panel, or click
   it to choose them, then click **Upload and build**. The app saves the files, runs the existing
   build script, and refreshes the chart -- no terminal required for this part.

The build script identifies which planet and publication a file belongs to from the `PL_NAME`,
`REFERENCE`, and `NOTE` keywords every real downloaded file embeds in its own header (verified against
a real download; matching by file name alone does not work, because the archive's download file names
never match the inventory's internal `spec_path`). It also reads the file's own column-units row
(for example "%" for transit depth) instead of assuming a unit.

## Prerequisites

- Node.js 18.18 or newer (Node 20+ recommended).
- Python 3.11+ on `PATH` as `python` (or `python3`/`py`), with the packages the existing scripts in
  `../data` already require (`astroquery`, `astropy`, `pandas`, `matplotlib`). The API routes invoke
  those scripts directly; they do not reimplement FITS parsing or archive queries.
- The dataset CSVs under `../data`. The NASA and MAST inventories are committed; the per-point
  spectra are produced locally, either via the in-app panels above or the pipeline scripts directly.
  Either source may be empty: the app still builds and runs and shows a clear empty state.

## Install, run, and build

From this `frontend/` folder:

```
npm install         # install dependencies
npm run dev         # start the dev server at http://localhost:3000
npm run build       # production build
npm start           # serve the production build
```

There is no separate data-prep step to run: the API routes under `src/app/api` read the CSVs under
`../data` live, on every request, so the app always reflects the current state of those files.

## Project layout

```
frontend/
  src/
    app/
      api/                 route handlers: live dataset reads, NASA upload, MAST catalog/dry-run/download, job polling
      ...                  Next.js App Router (layout, page, global styles)
    components/            UI components (toggle, tabs, chart, views, population panels)
    lib/
      server/              Node-only: CSV parsing, dataset building, path constants, the job runner
      ...                  theme, types, content, science bands, formatting, client data-fetching hook
```

## Notes

- The app fabricates nothing. Spectra, planet and target names, wavelengths, and values come solely
  from the real CSVs under `../data`, read live. Explanatory copy and the science-band values (taken
  verbatim from the project docs) are the only static text.
- API routes validate any user-supplied target name or file name against the real inventory or a
  strict `.tbl` filename pattern before touching the filesystem or spawning a process, and pass
  arguments as argv arrays (never through a shell), to avoid path traversal or command injection.
- Downloads and uploads use an in-memory job/lock per server process: only one download per target
  can run at a time, and there is no persistence across a server restart. This matches the tool's
  single-user, local scope.
- The seed colour for the Material You palette is set in `src/lib/theme.ts`; change that one value to
  retheme the whole app.
