# Frontend: JWST MIRI Spectra Explorer

Context for work under `frontend/`. This loads in addition to the root [CLAUDE.md](../CLAUDE.md);
everything there still applies (attribution, human in the loop, data hygiene, never fabricate a
number or a data row). This file adds what is specific to the web app. The full user-facing
description is in [README.md](README.md); the enforceable frontend rules are in
[../.claude/rules/frontend.md](../.claude/rules/frontend.md).

## What this is (and is not)

A small, self-contained Next.js app that displays the project's JWST MIRI transmission-spectroscopy
dataset and acts as a local control surface for the existing data-pipeline scripts under
[../data](../data). It is a viewer and a launcher, not the science pipeline. It reads the CSVs under
`../data` live on every request and can invoke the Python scripts there in response to button
clicks. It never runs retrieval, never computes an upper limit, and never fabricates data.

It is a local developer tool, not a public web app. Its API routes write files under `../data` and
spawn local Python processes with no authentication. That is appropriate for `npm run dev` or
`npm start` on your own machine, and unsafe to deploy on the open internet as-is. Do not add
network exposure without authentication, and do not weaken the input validation described below.

## Stack

- Next.js 15 (App Router) with React 19 and TypeScript in `strict` mode. Route handlers under
  `src/app/api` double as a small local backend.
- Material Design 3 / Material You: the tonal palette is generated from one seed colour in
  [src/lib/theme.ts](src/lib/theme.ts) with `@material/material-color-utilities`, emitted as
  `--md-sys-color-*` CSS custom properties for light and dark. Fonts and Material Symbols are linked
  in the document head (not `next/font`), so the production build needs no network access. Keep it
  that way.
- Recharts for the spectrograph, chosen for native error-bar support (the NASA transit-depth
  uncertainties).

## Commands (run from `frontend/`)

```
npm install
npm run dev     # dev server at http://localhost:3000
npm run build   # production build
npm run lint    # next lint (ESLint)
npm start       # serve the production build
```

Verify a change before reporting it done: `npm run build` and `npm run lint` both clean, and the
affected view exercised in `npm run dev`. There is no test suite yet. Node 18.18 or newer (20+
recommended); the API routes need Python 3.11+ on PATH with the packages the `../data` scripts
require (astroquery, astropy, pandas, matplotlib).

## Layout

- `src/app/` App Router: `layout.tsx`, `page.tsx`, `globals.css`, and `api/` route handlers (live
  dataset reads, NASA upload, MAST catalog, dry-run, download, and job polling).
- `src/components/` client UI (source toggle, tabs, chart, the three views, population panels).
- `src/lib/` shared client code (theme, types, content, science bands, formatting, the `useDataset`
  hook).
- `src/lib/server/` Node-only code: CSV parsing, dataset building, path constants, the job runner.
  Do not import these from a client component.
- The `@/*` path alias maps to `src/*` (see [tsconfig.json](tsconfig.json)).

## Conventions specific to the frontend

- Two sources, two meanings. The source toggle swaps NASA (published transit depth, the real science
  input) and MAST (median extracted flux, a demo sanity-check that is not a transmission spectrum and
  not a result). Keep that distinction visible in any UI or copy you touch: a MAST demo must never
  read as a science result. This is the upper-limits-not-hype principle applied to the interface.
- Server-only code stays under `src/lib/server`. Anything that touches the filesystem or spawns a
  process belongs there and in route handlers, never in a client component.
- Validate before touching disk or spawning. API routes must validate any user-supplied target or
  file name against the real inventory or a strict `.tbl` filename pattern, and pass arguments as
  argv arrays, never through a shell. Preserve this when editing routes.
- Data hygiene still applies (root invariant 9). The app writes downloaded and uploaded products
  under `../data`; those paths are already git-ignored by the root `.gitignore`, as are
  `node_modules/` and `.next/`. Never commit what the app downloads, and never add code that
  fabricates a spectrum, name, wavelength, or value.
- Science-band values (the 8.6 to 11.8 micrometre window, ozone near 9.6 micrometres) shown on the
  chart come from the project docs. Do not invent or adjust them here; they annotate the frozen
  science, they are not new numbers.
