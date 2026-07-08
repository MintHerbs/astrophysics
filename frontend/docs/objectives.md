# Objectives and scope

## What the app is

The JWST MIRI Spectra Explorer is a small, self-contained Next.js app that does two things:

1. Displays the project's JWST MIRI transmission-spectroscopy dataset, with a prominent toggle that
   switches the whole view between the two archive sources, the NASA Exoplanet Archive and MAST.
2. Acts as a local control surface for the existing data-pipeline scripts under [../../data](../../data):
   it can download MAST products, build median spectra, and ingest NASA `.tbl` files, all from inside
   the app in response to button clicks.

It reads the CSVs under `../../data` live, on every request, and can invoke the Python scripts there.
It is a viewer and a launcher.

## What the app is not

- It is not the science pipeline. It never runs retrieval, never trains a model, never computes a
  posterior, and never produces an upper limit. Those belong to the `technosig` package under
  [../../src](../../src) and are governed by the science guardrails in
  [../../.claude/rules/science.md](../../.claude/rules/science.md).
- It is not a public web app. Its API routes write files under `../../data` and spawn local Python
  processes with no authentication. That is correct for `npm run dev` or `npm start` on your own
  machine, and unsafe to deploy on the open internet as-is. Do not add unauthenticated network
  exposure, and do not weaken the input validation described in
  [api-and-server-reference.md](api-and-server-reference.md).
- It is not a source of data. It fabricates nothing. Spectra, planet and target names, wavelengths,
  and values come solely from the real CSVs and `.tbl` files under `../../data`, read live. The only
  static text is explanatory copy and the science-band annotations, both taken from the project docs.

## The single honesty principle: two sources mean two different things

This is the most important idea in the whole interface, and it is the upper-limits-not-hype principle
from [../../CLAUDE.md](../../CLAUDE.md) applied to a screen. The source toggle swaps the data, the
axis labels, and the caption, because the two sources are not the same kind of measurement:

- NASA Exoplanet Archive: published, reduced transmission spectra. The y-axis is transit depth. This
  is a real transmission spectrum and the actual input to the technosignature and biosignature
  pipeline. It is badged as a transmission spectrum (the primary, "transmission" chip).
- MAST: downloaded demo products. The y-axis is median extracted flux (X1DINTS FLUX, pooled over
  integrations). This is raw extracted stellar flux, used only to sanity-check that the data are real
  and cover the MIRI band. It is not a transmission spectrum and not a science result. It is badged
  as a demo (the "demo" chip) and carries an explicit caution banner.

Any UI or copy you touch must keep this distinction obvious. A MAST demo must never read as a science
result. If a change would blur the line between the real input and the demo product, it is out of
scope until the distinction is restored.

## Why the app exists

The science team needs to inspect exactly which archival spectra exist, what they cover, and where
they came from, before feeding any of them to the pipeline. The app makes the archive tangible: it
shows the real spectra with their references and provenance, annotates the mid-infrared window where
the target gases absorb (roughly 8.6 to 11.8 micrometres, with ozone near 9.6 micrometres), and lets
a user grow the local dataset without leaving the browser or memorising a terminal command. It keeps
the honest boundary between a real transmission spectrum and a raw demo product visible at every
step.

## Non-negotiables (inherited)

Every root invariant in [../../CLAUDE.md](../../CLAUDE.md) applies here in full. The ones that bite
most often in frontend work:

- Archive-only. Never add code that collects new observations.
- Never fabricate. No synthesised spectrum, planet name, wavelength, value, or placeholder data row.
- Never guess a number. The science-band values are taken verbatim from the docs; do not invent or
  adjust them.
- Data hygiene. Never commit what the app downloads or uploads, `node_modules/`, or `.next/`.
- Human in the loop. No commit, push, PR, or merge without explicit go-ahead for that action.
- Solo authorship. No `Co-Authored-By` or tool-attribution line in any commit or PR.
