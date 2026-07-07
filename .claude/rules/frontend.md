---
paths:
  - "frontend/**"
---

# Frontend rules (the local viewer and control surface)

> Applies to work under `frontend/`. Orientation and stack detail:
> [frontend/CLAUDE.md](../../frontend/CLAUDE.md) and [frontend/README.md](../../frontend/README.md).
> These are the hard rules; the root invariants in [CLAUDE.md](../../CLAUDE.md) still apply in full.

The frontend is a viewer and a local launcher for the data-pipeline scripts under
[data/](../../data). It does not run the science pipeline, compute a posterior, or produce an upper
limit. Keep it in that role.

- Local tool, not a public app. The API routes write under `data/` and spawn Python with no
  authentication. That is correct for single-user local use only. Do not add unauthenticated network
  exposure, and do not weaken the input validation.
- Fabricate nothing. Spectra, planet and target names, wavelengths, and values come only from the
  real CSVs under `data/`, read live. The only static text is explanatory copy and the science-band
  annotations taken verbatim from the docs. Never synthesise a data row or a placeholder value.
- Keep the two sources honest. NASA is published transit depth (the real science input); MAST is
  median extracted flux (a demo sanity-check, not a transmission spectrum and not a result). The UI
  must keep the distinction obvious. This is the upper-limits framing in [CLAUDE.md](../../CLAUDE.md)
  applied to the interface; see also [documentation.md](documentation.md) for reachability.
- Data hygiene (root invariant 9). Everything the app downloads or uploads under `data/` is bulk data
  and stays git-ignored; the root `.gitignore` already covers `data/*/raw/`, `mastDownload/`, and the
  generated per-point CSVs. Never commit those, and never commit `frontend/node_modules` or
  `frontend/.next`. Background: [data.md](data.md).
- Server boundary. Filesystem and process access lives in `frontend/src/lib/server` and the route
  handlers, never in a client component. Validate any user-supplied name against the real inventory
  or a strict `.tbl` pattern and pass arguments as argv arrays, never through a shell.
- Verify before done. `npm run build` and `npm run lint` clean, and the touched view exercised in
  `npm run dev`. Report the real outcome, including failures and skips.
