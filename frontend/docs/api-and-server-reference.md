# API and server reference

The route handlers under `src/app/api` are the app's local backend. They and the modules under
`src/lib/server` are the only code that reads or writes the filesystem or spawns a process. This
document is the route-by-route and module-by-module reference, plus the security rules every handler
must keep.

Every handler declares `runtime = "nodejs"` and `dynamic = "force-dynamic"`, so it runs on Node and
always reflects the current state of [../../data](../../data).

## Security rules (do not weaken these)

The app is single-user and local, but the routes still validate every input, because they touch the
filesystem and spawn processes. When editing a route, preserve all of the following:

- Validate any user-supplied target name against the real inventory (`knownTargetNames()`), and any
  file name against a strict `.tbl` pattern (`^[A-Za-z0-9._+\-]+\.tbl$`), before touching disk.
- Pass arguments to Python as argv arrays via `spawn`, never through a shell. There is no string
  interpolation into a command line anywhere.
- Cap uploads: at most 100 files, each at most 5 MB, and use `path.basename` to strip any directory
  component (blocks path traversal).
- Downloads are gated by a per-target lock so two overlapping downloads of the same target cannot
  run.

These are the concrete form of the "local tool, not a public app" rule in
[../.claude/rules/engineering.md](../.claude/rules/engineering.md).

## Routes

### GET `/api/dataset/[source]`

[dataset/[source]/route.ts](../src/app/api/dataset/%5Bsource%5D/route.ts). Returns the fully built
`SourceData` for the source. Calls `buildNasa()` for `nasa`, `buildMast()` for `mast`, 404 for
anything else. This is what the four views render.

### GET `/api/dataset/raw?source=<nasa|mast>`

[dataset/raw/route.ts](../src/app/api/dataset/raw/route.ts). Returns the untouched inventory CSV as
`{ headers, rows }` (rows are arrays of string cells keyed by header). Used by the Dataset view's
clean table and spreadsheet. Reads `NASA_SPECTRA_CSV` (`spectra.csv`) or `MAST_INVENTORY_CSV`.
Returns 400 for an invalid source, 404 when the file is missing.

For NASA this is the same `spectra.csv` catalogue the built dataset (`buildNasa`) reads, so every
NASA view is consistent; the Dataset tab is just a raw, as-is read of it (upper-case archive-export
headers). See [data files](#data-files) below.

### GET `/api/mast/catalog`

[mast/catalog/route.ts](../src/app/api/mast/catalog/route.ts). Reads the MAST inventory and returns
targets grouped by `target_name` (the unit the downloader operates on), each with observation count,
wavelength coverage, summed exposure time, proposal ids, an `is_exoplanet` flag derived from MAST's
own classification, and an `already_downloaded` flag from the median CSV. Also returns
`exoplanetCount` and `totalCount`.

### POST `/api/mast/dry-run`

[mast/dry-run/route.ts](../src/app/api/mast/dry-run/route.ts). Body: `{ target }`. Validates the
target, runs the downloader in `--dry-run` mode, parses the real file count and total size in GB from
its output, and returns `{ ok, fileCount, totalGb, log }`. Never downloads. The size shown to the
user is measured, not estimated.

### POST `/api/mast/download`

[mast/download/route.ts](../src/app/api/mast/download/route.ts). Body: `{ target }`. Validates the
target, acquires the per-target lock (409 if already running), creates a job, and returns
`{ jobId }` with status 202 immediately. In the background it runs the download script then the plot
script, and on success stores the rebuilt MAST dataset as the job result. Poll `/api/jobs/[id]` for
progress.

### POST `/api/nasa/upload`

[nasa/upload/route.ts](../src/app/api/nasa/upload/route.ts). Body: `multipart/form-data` with one or
more `files`. Validates each name against the `.tbl` pattern and size cap, saves the valid ones under
`data/NASA_Archive/raw/`, runs the NASA build script, and returns `{ ok, saved, skipped, log,
dataset }`. Rejects with 400 if no valid files were saved.

### GET `/api/jobs/[id]`

[jobs/[id]/route.ts](../src/app/api/jobs/%5Bid%5D/route.ts). Returns `{ id, status, log, result,
error }` for the job. `status` is `running`, `done`, or `error`; `result` is only populated when
done. 404 for an unknown id.

## Server modules

### paths.ts

[../src/lib/server/paths.ts](../src/lib/server/paths.ts). Resolves the repo root as
`process.cwd()/..` (the app runs from `frontend/`) and defines every data path and script path from
there. Import path constants from here; never build a data path inline.

### csv.ts

[../src/lib/server/csv.ts](../src/lib/server/csv.ts). A minimal RFC 4180 parser (`readCsv`) that
handles quoted fields and embedded commas/newlines, plus coercion helpers: `num`, `int`, `str`
(treating empty/`nan`/`na` as null), `basename`, `minMax`, and `uniqueOrdered`. Returns `null` when
the file does not exist, so a missing source degrades to an empty state rather than an error.

### ipac.ts

[../src/lib/server/ipac.ts](../src/lib/server/ipac.ts). Parses the NASA archive's per-spectrum IPAC
Table Format. The `.tbl` files are fixed-width, pipe-delimited across up to four header rows (name,
type, unit, null), with `\KEYWORD = value` comment lines carrying `PL_NAME`, `REFERENCE`, and `NOTE`.
`extractSpectrumPoints` slices data rows at the name row's pipe offsets, matches the wavelength,
depth, and error columns by name hints, reads the units row rather than assuming a unit, and returns
tidy points sorted by wavelength. It deliberately mirrors the heuristics in
`data/NASA_Archive/build_nasa_spectra_dataset.py` so the two readers agree.

### buildDataset.ts

[../src/lib/server/buildDataset.ts](../src/lib/server/buildDataset.ts). The heart of the live-read
model.

- `buildNasa()`: reads the `spectra.csv` catalogue, and for each row resolves its `.tbl` file (by
  exact basename, directly under `NASA_DIR` or the `raw/` upload folder), parses its points via
  `ipac.ts`, and assembles a `Spectrum`. Records a per-spectrum status note when a file is missing or
  unparseable, so the UI can explain gaps honestly. Groups spectra by planet.
- `buildMast()`: reads the median-flux CSV and the inventory, groups median points by observation,
  and enriches each with inventory metadata. MAST spectra render as a line and carry no error bars.
- `mastDownloadedTargets()`: the set of target names already present in the median CSV, used to mark
  the picker.

### jobs.ts

[../src/lib/server/jobs.ts](../src/lib/server/jobs.ts). The in-memory job runner. `runPython` tries
`python`, then `python3`, then `py`, streaming stdout and stderr into the job log and resolving on
exit code 0. The job map and the active-target lock set are pinned to `globalThis` because in
`next dev` a route module can be reinstantiated between requests, which would otherwise drop a job
started by one request and make a poll from another 404 spuriously. State does not persist across a
server restart; that matches the single-user, local scope.

## Data files

Defined in [paths.ts](../src/lib/server/paths.ts), all under [../../data](../../data):

- NASA (what the frontend reads): `spectra.csv`, the single NASA catalogue (a Firefly export of the
  Atmospheric Spectroscopy table), and the per-spectrum `.tbl` files beside it, whose `SPEC_PATH`
  basenames resolve to those files. Both the built dataset and the raw Dataset view read
  `spectra.csv`. `raw/` is the upload target; `build_nasa_spectra_dataset.py` is run after an upload.
- NASA (standalone Python pipeline, not read by the frontend): `fetch_nasa_miri_spectra.py` writes a
  separate programmatic inventory `nasa_miri_spectra.csv`, and `build_nasa_spectra_dataset.py` writes
  `nasa_miri_spectra_points.csv` (a tidy long-format points export). The app is driven entirely by
  `spectra.csv` plus the `.tbl` files; these two files feed the science side and the docs, not the UI.
- MAST: `mast_miri_inventory.csv`, `mast_median_spectra.csv`, `raw/`, `download_mast_products.py`,
  `plot_mast_spectrum.py`.

Everything the app downloads or uploads under `data/` is bulk data and stays git-ignored. Never
commit it, and never add code that fabricates a spectrum, name, wavelength, or value. See
[../../.claude/rules/data.md](../../.claude/rules/data.md).
