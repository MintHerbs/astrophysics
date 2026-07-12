# Component and module catalogue

Every source file under `src/`, with its responsibility. Client components are marked `"use client"`;
everything under `src/lib/server` and `src/app/api` is server-only. See
[architecture.md](architecture.md) for the layer boundary.

## App Router shell (`src/app/`)

| File | Role |
| --- | --- |
| [layout.tsx](../src/app/layout.tsx) | Root layout. Injects the generated theme CSS as a blocking `<style>`, links Roboto / Roboto Mono / Material Symbols in the head, renders `ThemeScript` and `TopAppBar`. Sets the page metadata. |
| [page.tsx](../src/app/page.tsx) | The home route. Renders `Dashboard`. |
| [globals.css](../src/app/globals.css) | The whole design system in CSS: shape and type scales, elevation, and every component style. See [design-system.md](design-system.md). |

## Components (`src/components/`)

| Component | Role |
| --- | --- |
| [Dashboard.tsx](../src/components/Dashboard.tsx) | Top-level orchestrator. Owns source, view, and per-source selection state; loads both datasets; renders the toggle, tabs, and active view; handles the global loading/error states. |
| [TopAppBar.tsx](../src/components/TopAppBar.tsx) | Sticky app bar with brand mark, title, subtitle, and the theme toggle. |
| [ThemeToggle.tsx](../src/components/ThemeToggle.tsx) | Light/dark toggle. Sets `data-theme` on `<html>` and persists to `localStorage`; renders a neutral icon until mounted to avoid a hydration mismatch. |
| [ThemeScript.tsx](../src/components/ThemeScript.tsx) | Blocking inline script that applies the saved theme before first paint (no flash of the wrong scheme). |
| [SourceToggle.tsx](../src/components/SourceToggle.tsx) | The large segmented button that switches between NASA and MAST. |
| [NavTabs.tsx](../src/components/NavTabs.tsx) | The tab bar. Defines the four views and the `ViewKey` type. |
| [ViewerView.tsx](../src/components/ViewerView.tsx) | The Spectrograph view: measurement banner, spectrum selector, chart, reference card, populate panel. Chooses a default spectrum that overlaps the technosignature window. |
| [DatasetView.tsx](../src/components/DatasetView.tsx) | The Dataset view: a clean/spreadsheet switch over the raw inventory. |
| [CleanRawTable.tsx](../src/components/CleanRawTable.tsx) | The clean raw-table renderer: sortable `table.data`, client pagination, CSV export, study-column highlights. |
| [RawDataGrid.tsx](../src/components/RawDataGrid.tsx) | The AG Grid spreadsheet renderer: sort, filter, column show/hide, multi-row select, per-column manual highlight, CSV export. |
| [OverviewView.tsx](../src/components/OverviewView.tsx) | The Dataset overview: stat grid plus a per-planet/target table. |
| [DictionaryView.tsx](../src/components/DictionaryView.tsx) | The Data dictionary: provenance plus two column-description tables. |
| [SpectrumChart.tsx](../src/components/SpectrumChart.tsx) | The Recharts chart. Scatter with error bars (NASA) or line (MAST), science-band annotations, custom tooltip and legend. Loaded via `next/dynamic` with `ssr: false`. |
| [ChartBoundary.tsx](../src/components/ChartBoundary.tsx) | React error boundary around the chart. |
| [NasaCatalogPicker.tsx](../src/components/NasaCatalogPicker.tsx) | NASA populate panel: searchable catalogue, plot buttons, deep links into the archive, and the upload-and-build drop zone. |
| [MastCatalogPicker.tsx](../src/components/MastCatalogPicker.tsx) | MAST populate panel: browsable target list, size check (dry-run), download job with live log polling. |
| [EmptyState.tsx](../src/components/EmptyState.tsx) | The shared empty-state panel with a numbered step list. |
| [Icon.tsx](../src/components/Icon.tsx) | Material Symbols (rounded) icon. Decorative (`aria-hidden`) by default; optional size and fill. |

## Shared client library (`src/lib/`)

| Module | Role |
| --- | --- |
| [theme.ts](../src/lib/theme.ts) | Generates the Material You palette from `SEED_COLOR` and emits `buildThemeCss()`. The one place colour is decided. |
| [types.ts](../src/lib/types.ts) | TypeScript types for the dataset shape: `SourceKey`, `SpectrumPoint`, `Spectrum`, `Group`, `Counts`, `SourceData`. |
| [content.ts](../src/lib/content.ts) | Static per-source copy: names, badges, axis labels, captions, cautions, provenance, empty-state steps, and column descriptions. Explanatory text only, never data. |
| [science.ts](../src/lib/science.ts) | The science-band annotations (technosignature window, ozone line), each with the docs it was taken from. Verbatim from the project docs. |
| [format.ts](../src/lib/format.ts) | Small formatting helpers: `fmtNumber`, `fmtInt`, `fmtRange`, `fmtMeta`. |
| [rawColumnHighlights.ts](../src/lib/rawColumnHighlights.ts) | The lists of study-relevant column names highlighted in the raw tables (`NASA_HIGHLIGHTS`, `MAST_HIGHLIGHTS`). |
| [useDataset.ts](../src/lib/useDataset.ts) | The `useDataset(source)` hook (fetch plus `reload()`) and `pollJob(id, onUpdate)` for the download job. |

## Server-only modules (`src/lib/server/`)

Never import these from a client component. See [api-and-server-reference.md](api-and-server-reference.md).

| Module | Role |
| --- | --- |
| [paths.ts](../src/lib/server/paths.ts) | Central path resolution for every data file and script, relative to the repository root. |
| [csv.ts](../src/lib/server/csv.ts) | A minimal RFC 4180 CSV reader plus numeric/string coercion helpers. |
| [ipac.ts](../src/lib/server/ipac.ts) | Parser for the NASA archive's per-spectrum IPAC Table Format (`.tbl`) files; matches wavelength/depth/error columns by name and reads the file's own units row. Mirrors the Python build script's heuristics. |
| [buildDataset.ts](../src/lib/server/buildDataset.ts) | The live dataset builder: `buildNasa()`, `buildMast()`, and `mastDownloadedTargets()`. Reads the CSVs and `.tbl` files on every call and returns `SourceData`. |
| [jobs.ts](../src/lib/server/jobs.ts) | The in-memory job runner: create/get/finish/fail a job, stream a Python subprocess into its log, and a per-target lock. Pinned to `globalThis` to survive dev route-module reinstantiation. |

## API route handlers (`src/app/api/`)

| Route | Method | Role |
| --- | --- | --- |
| [dataset/[source]/route.ts](../src/app/api/dataset/%5Bsource%5D/route.ts) | GET | Returns the built `SourceData` for `nasa` or `mast`. |
| [dataset/raw/route.ts](../src/app/api/dataset/raw/route.ts) | GET | Returns the raw inventory CSV as `{ headers, rows }` for the Dataset view. |
| [mast/catalog/route.ts](../src/app/api/mast/catalog/route.ts) | GET | Lists MAST targets (grouped) for the picker. |
| [mast/dry-run/route.ts](../src/app/api/mast/dry-run/route.ts) | POST | Reports a target's download size without downloading. |
| [mast/download/route.ts](../src/app/api/mast/download/route.ts) | POST | Starts the download+build job; returns a job id (202). |
| [nasa/upload/route.ts](../src/app/api/nasa/upload/route.ts) | POST | Accepts uploaded `.tbl` files and runs the build script. |
| [jobs/[id]/route.ts](../src/app/api/jobs/%5Bid%5D/route.ts) | GET | Returns a job's status and log for polling. |
