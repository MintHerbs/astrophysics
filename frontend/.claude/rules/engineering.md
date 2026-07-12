---
paths:
  - "frontend/**"
---

# Frontend engineering rules

> Hard rules for code under `frontend/`. Orientation: [../../CLAUDE.md](../../CLAUDE.md) and
> [../../docs/architecture.md](../../docs/architecture.md). These mirror and localise the repo-root
> frontend rules in [../../../.claude/rules/frontend.md](../../../.claude/rules/frontend.md); the root
> invariants in [../../../CLAUDE.md](../../../CLAUDE.md) apply in full.

The frontend is a viewer and a local launcher for the data-pipeline scripts under
[../../../data](../../../data). It does not run the science pipeline, compute a posterior, or produce
an upper limit. Keep it in that role.

- Local tool, not a public app. The API routes write under `data/` and spawn Python with no
  authentication. That is correct for single-user local use only. Do not add unauthenticated network
  exposure, and do not weaken the input validation below.
- Fabricate nothing. Spectra, planet and target names, wavelengths, and values come only from the
  real CSVs and `.tbl` files under `data/`, read live. The only static text is explanatory copy and
  the science-band annotations, taken verbatim from the docs. Never synthesise a data row or a
  placeholder value.
- Keep the two sources honest. NASA is published transit depth (the real science input); MAST is
  median extracted flux (a demo sanity-check, not a transmission spectrum and not a result). The UI
  must keep the distinction obvious: the badge, the caption, and the caution banner. This is the
  upper-limits-not-hype principle applied to the interface.
- Server boundary. Filesystem and process access lives in `frontend/src/lib/server` and the route
  handlers, never in a client component. Validate any user-supplied name against the real inventory
  (`knownTargetNames()`) or the strict `.tbl` pattern, and pass arguments as argv arrays, never
  through a shell. Cap uploads (100 files, 5 MB each) and strip directory components with
  `path.basename`.
- Live reads, not snapshots. The dataset is rebuilt from source on every request via `buildDataset`.
  Do not reintroduce a one-shot "generate JSON" build step; a populate action must be visible on the
  next `reload()`. If you touch the stale `prepare-data` references in `types.ts`/`content.ts`, fix
  the copy rather than rebuilding the old step. See
  [../../docs/architecture.md](../../docs/architecture.md).
- Never guess a number. The science-band values (8.6 to 11.8 micrometres, ozone near 9.6) come from
  [../../src/lib/science.ts](../../src/lib/science.ts) and the project docs. Do not invent or adjust
  them here; they annotate the frozen science.
- Data hygiene (root invariant 9). Everything the app downloads or uploads under `data/` is bulk data
  and stays git-ignored, as do `frontend/node_modules` and `frontend/.next`. Never commit those.
- Verify before done. `npm run build` and `npm run lint` clean, and the touched view exercised in
  `npm run dev`. There is no test suite yet. Report the real outcome, including failures and skips.
