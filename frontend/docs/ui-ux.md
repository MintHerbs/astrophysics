# UI and UX

This document describes the interaction model: the layout, the source toggle, the four views, the
populate flows, the loading/empty/error states, and the copy rules that keep the interface honest.

## Layout at a glance

- A sticky top app bar ([TopAppBar](../src/components/TopAppBar.tsx)) with the brand mark, the title
  "JWST MIRI Spectra Explorer", a one-line subtitle, and the theme toggle on the right.
- A single centred page column (`.page`, max width 1200px) holding, top to bottom:
  1. The data-source selector card (the toggle plus a one-line explanation).
  2. The tab bar ([NavTabs](../src/components/NavTabs.tsx)).
  3. The active view.

The whole thing is driven by [Dashboard](../src/components/Dashboard.tsx), which owns three pieces of
state: the active `source` (`nasa` or `mast`), the active `view`, and the selected spectrum id per
source. It loads both datasets up front via `useDataset` so switching source is instant.

## The source toggle

A large segmented button ([SourceToggle](../src/components/SourceToggle.tsx)) that switches the whole
view between NASA and MAST. Switching source changes the data, the chart axis labels, the captions,
the badges, and the provenance, because the two sources measure different quantities. This is the
honesty principle made physical; see [objectives.md](objectives.md). The per-source copy that drives
all of this lives in [../src/lib/content.ts](../src/lib/content.ts).

## The four views (tabs)

Tabs are defined in [NavTabs](../src/components/NavTabs.tsx). All four operate on the active source.

### 1. Spectrograph ([ViewerView](../src/components/ViewerView.tsx))

The main view. Top to bottom:

- A measurement banner: a chip stating what the source is (transmission spectrum or extracted-flux
  demo), a chip naming the y-axis, an info banner with the caption, and, for MAST only, a caution
  banner that says in bold that this is not a science result.
- A spectrum selector: a native `<select>` grouped by planet (NASA) or target (MAST). Options for
  spectra with no loaded points are marked "(no points loaded)".
- The chart ([SpectrumChart](../src/components/SpectrumChart.tsx)), or an empty state if the selected
  spectrum has no plottable points yet.
- A reference-and-source card: bibcode (linked to ADS), authors, pipeline note, wavelength coverage,
  depth unit, points loaded, and the source-specific metadata rows.
- A populate panel (see below).

Default selection is deliberate: rather than the first catalogue row, the view defaults to a spectrum
that actually overlaps the technosignature target window (8.6 to 11.8 micrometres) when one is
available, so the science-band annotation is visible on first load.

### 2. Dataset ([DatasetView](../src/components/DatasetView.tsx))

A full, raw read of the active source's inventory CSV, with a segmented switch between two renderers:

- Clean ([CleanRawTable](../src/components/CleanRawTable.tsx)): a styled `table.data` with
  click-to-sort headers, client-side pagination (50/100/250 rows), and a "Download CSV" button that
  exports the current sorted rows. Study-relevant columns are highlighted.
- Spreadsheet ([RawDataGrid](../src/components/RawDataGrid.tsx)): an AG Grid with per-column sort and
  filter, column show/hide via a dropdown, multi-row selection, pagination (100/250/500), a
  per-column palette button to toggle a manual highlight, and native CSV export.

Both fetch `/api/dataset/raw?source=<source>` and share the study-column highlight lists in
[../src/lib/rawColumnHighlights.ts](../src/lib/rawColumnHighlights.ts). The copy tells the user the
purple columns are the ones specific to the transmission-spectroscopy study.

### 3. Dataset overview ([OverviewView](../src/components/OverviewView.tsx))

Summary statistics as a stat grid (spectra or observations, planets or targets, points loaded,
published points) and a table of each planet or target with its spectrum count, wavelength coverage,
point counts, and references. For NASA, when the catalogue is present but no numeric points are
loaded yet, an info banner explains that the catalogue is committed but the points are a separate
manual download.

### 4. Data dictionary ([DictionaryView](../src/components/DictionaryView.tsx))

Provenance for the active source (archive, product kind, a copyable query, and notes), followed by
two column tables that pair each real CSV column with a plain-language description. Column names come
from the live dataset; descriptions come from [../src/lib/content.ts](../src/lib/content.ts) and are
matched by name.

## Populating data from inside the app

The two sources have different automation ceilings, and the UI is honest about that.

### MAST: fully automatic ([MastCatalogPicker](../src/components/MastCatalogPicker.tsx))

MAST has a real programmatic API (`astroquery`), so the whole flow is in-app:

1. Open "Browse MAST observations". It lists every real MIRI LRS target from the inventory,
   searchable by name, with an optional "MAST-classified exoplanet targets only" filter (off by
   default, because MAST's `target_classification` is not a reliable exoplanet-host flag; for example
   WASP-107 is classified only as a K dwarf).
2. "Check size" runs the downloader's `--dry-run` and shows the real size and file count. Nothing is
   downloaded.
3. "Download" starts a background job, streams its log into a status banner, and on completion
   refreshes the chart automatically. Already-downloaded targets show a "Downloaded" chip.

### NASA: the archive step is manual, everything around it is not ([NasaCatalogPicker](../src/components/NasaCatalogPicker.tsx))

The NASA Exoplanet Archive serves per-spectrum `.tbl` files only through a session-based browser
interface with no stable scriptable URL, so that one step cannot honestly be automated from a server.
The app automates the rest:

1. Open "Find a spectrum in the archive" and search for a planet. Rows with loaded points offer a
   "Plot" button; rows without offer "Open in archive", a deep link pre-filtered to that planet's
   spectra.
2. On the archive, download the chosen `.tbl` files.
3. Drag them into the "Populate NASA spectra" drop zone (or click to choose), then upload and build.
   The app saves the files and runs the existing build script, then refreshes.

The upload route identifies each file's planet and publication from the `PL_NAME`, `REFERENCE`, and
`NOTE` keywords embedded in the file's own header (never by file name, which never matches the
inventory's internal path), and reads the file's own units row rather than assuming a unit.

## State handling

- Loading: a centred `.spinner` with a label while a dataset or the chart first loads.
- Empty: [EmptyState](../src/components/EmptyState.tsx), a dashed panel with an icon, a headline, a
  body, and a numbered step list. Used when a source has nothing catalogued, or a spectrum has no
  loaded points. The steps come from the per-source copy.
- Error: a caution banner (`role="alert"`) for a failed dataset load, and [ChartBoundary](../src/components/ChartBoundary.tsx),
  a React error boundary, so a chart render failure shows a message instead of blanking the page.
- In-progress jobs: a status banner (`role="status"`) with a spinning icon and the last lines of the
  job log.

## The chart in detail ([SpectrumChart](../src/components/SpectrumChart.tsx))

- Built with Recharts' `ComposedChart`. NASA transmission spectra render as a `Scatter` with 1-sigma
  `ErrorBar`s (when uncertainties are present); the MAST demo renders as a connected `Line`, because
  it is a continuous flux curve, not a set of independent measurements.
- Axes: wavelength in micrometres on X, the source's quantity on Y (with the file's own unit appended
  when known). Domains are padded so points and error bars are not clipped.
- Science-band annotations, both taken verbatim from the project docs via
  [../src/lib/science.ts](../src/lib/science.ts): a shaded `ReferenceArea` for the technosignature
  target window (8.6 to 11.8 micrometres, tertiary colour) and a dashed `ReferenceLine` for the ozone
  feature (near 9.6 micrometres, error colour). Both are drawn only when they fall inside the current
  x-domain. These annotate frozen science; do not invent or adjust the numbers.
- A custom tooltip on the inverse surface, and a legend that names the series and any visible bands.

## Copy and honesty rules

- Never let the MAST demo read as a result. The badge, caption, and caution banner exist for this;
  keep them if you touch that view.
- Explanatory copy and the science-band annotations are the only static text. Everything else (names,
  wavelengths, values, counts, references) comes from the live data. Do not hardcode a data value
  into the copy.
- Keep the units explicit and correct: micrometres for wavelength, the source's own recorded unit for
  the y-axis. The chart appends the unit the file actually declared; it never assumes one.
- Plain, formal language. No em dashes, no emoji, matching [../../CLAUDE.md](../../CLAUDE.md).
