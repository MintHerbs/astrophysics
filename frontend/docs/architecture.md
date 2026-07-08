# Architecture

## Stack

- Next.js 15 (App Router) with React 19 and TypeScript in `strict` mode. See
  [../package.json](../package.json) and [../tsconfig.json](../tsconfig.json).
- Route handlers under `src/app/api` double as a small local backend, in the same project as the
  client UI. There is no separate server.
- Material Design 3 / Material You for the design language. The tonal palette is generated from one
  seed colour in [../src/lib/theme.ts](../src/lib/theme.ts) with `@material/material-color-utilities`.
  See [design-system.md](design-system.md).
- Recharts for the spectrograph, chosen for native error-bar support (the NASA transit-depth
  uncertainties). See [../src/components/SpectrumChart.tsx](../src/components/SpectrumChart.tsx).
- AG Grid (`ag-grid-community` and `ag-grid-react`) for the interactive spreadsheet view of the raw
  inventory. See [../src/components/RawDataGrid.tsx](../src/components/RawDataGrid.tsx).

The `@/*` path alias maps to `src/*` (see [../tsconfig.json](../tsconfig.json)).

## The two layers and the boundary between them

The app has a hard split between client code and server-only code. Keeping that split intact is a
rule, not a preference (see [../.claude/rules/engineering.md](../.claude/rules/engineering.md)).

### Client layer (runs in the browser)

- `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`: the App Router shell, the theme
  stylesheet injected in the document head, and the global styles.
- `src/components/`: all UI. The top-level orchestrator is `Dashboard`; below it sit the source
  toggle, the tab bar, the four views, the chart, the two table renderers, and the populate panels.
- `src/lib/` (excluding `server/`): shared client code. Theme generation, the TypeScript types for
  the dataset shape, the static per-source copy, the science-band annotations, formatting helpers,
  the column-highlight lists, and the `useDataset`/`pollJob` data-fetching hooks.

Client code fetches everything it needs over HTTP from the API routes. It never touches the
filesystem and never spawns a process.

### Server layer (runs only in the Node process behind `npm run dev` / `npm start`)

- `src/app/api/`: the route handlers. Every handler sets `runtime = "nodejs"` and
  `dynamic = "force-dynamic"` so it always reads the current state of `../../data`.
- `src/lib/server/`: Node-only modules. Path constants ([paths.ts](../src/lib/server/paths.ts)), a
  minimal RFC 4180 CSV reader ([csv.ts](../src/lib/server/csv.ts)), the IPAC `.tbl` parser
  ([ipac.ts](../src/lib/server/ipac.ts)), the live dataset builder
  ([buildDataset.ts](../src/lib/server/buildDataset.ts)), and the in-memory job runner
  ([jobs.ts](../src/lib/server/jobs.ts)).

Anything that reads or writes the filesystem, or spawns a Python process, lives here or in a route
handler. It is never imported from a client component. `paths.ts` resolves everything relative to the
repository root (`FRONTEND_DIR/..`), so the app always operates on the real project data directory.

## How data reaches the screen

There is no separate data-preparation build step. Because the populate buttons can add or change
files under `../../data` at any time, the API routes rebuild the dataset from source on every
request rather than reading a stale snapshot.

```
browser                         Node server (API routes)              filesystem (../../data)
--------                        ------------------------              -----------------------
useDataset(source)   ─GET──▶    /api/dataset/[source]     ─reads──▶   spectra.csv + *.tbl (NASA)
                                buildNasa() / buildMast()             mast_*.csv (MAST)
     ◀──── SourceData JSON ─────
```

1. `Dashboard` mounts and calls `useDataset("nasa")` and `useDataset("mast")`
   ([../src/lib/useDataset.ts](../src/lib/useDataset.ts)).
2. Each hook does `fetch("/api/dataset/<source>", { cache: "no-store" })`.
3. The route handler ([../src/app/api/dataset/[source]/route.ts](../src/app/api/dataset/%5Bsource%5D/route.ts))
   calls `buildNasa()` or `buildMast()`.
4. The builder reads the CSVs live, parses each NASA `.tbl` on the fly, and returns a `SourceData`
   object (shape defined in [../src/lib/types.ts](../src/lib/types.ts)).
5. The views render that object. After a populate action, the component calls `reload()` and the
   whole cycle runs again, so the new files appear immediately.

The raw-table views take a slightly different path: they fetch
`/api/dataset/raw?source=<source>` ([../src/app/api/dataset/raw/route.ts](../src/app/api/dataset/raw/route.ts)),
which returns the untouched inventory CSV as `{ headers, rows }` for a faithful spreadsheet-style
read. See [data flow in the API reference](api-and-server-reference.md).

## Long-running actions: the job runner

A MAST download can take minutes, so it cannot block a request. The download route starts a
background job and returns a job id immediately (HTTP 202); the client polls `/api/jobs/[id]` until
it finishes. The job map is pinned to `globalThis` so it survives Next.js route-module
reinstantiation in dev, and a per-target lock prevents two overlapping downloads of the same target.
Details in [api-and-server-reference.md](api-and-server-reference.md) and
[../src/lib/server/jobs.ts](../src/lib/server/jobs.ts).

## Rendering choices worth knowing

- The theme stylesheet is generated at module load in `layout.tsx` and injected as a blocking
  `<style>` in the head, alongside a tiny blocking `ThemeScript` that applies the saved theme before
  first paint. This avoids a flash of the wrong colour scheme.
- Fonts and Material Symbols are linked in the document head, not via `next/font`, on purpose, so the
  production build needs no network access. Keep it that way.
- The chart is loaded with `next/dynamic` and `ssr: false`, because Recharts measures the DOM. It is
  wrapped in `ChartBoundary`, a React error boundary, so a chart failure never blanks the page.

## Live reads, not a snapshot step

There is no `scripts/prepare-data.mjs` step and no generated `src/data/*.json`: the app reads the
CSVs live through the API routes as described above. Earlier comments in
[../src/lib/types.ts](../src/lib/types.ts) and [../src/lib/content.ts](../src/lib/content.ts), and a
`npm run prepare-data` line in the MAST empty-state copy, referred to such a step and have been
corrected. Do not reintroduce a one-shot "generate JSON" build step; a populate action must be
visible on the next `reload()`.
