---
paths:
  - "frontend/**"
---

# Frontend design and UX rules

> Hard rules for styling and interaction under `frontend/`. The full design language is
> [../../docs/design-system.md](../../docs/design-system.md); the interaction model is
> [../../docs/ui-ux.md](../../docs/ui-ux.md). Read those before a non-trivial change. These are the
> short checklist.

## Colour and theming

- Every colour is a Material colour role (`--md-sys-color-*`), never a hex literal. The one exception
  is `SEED_COLOR` in [../../src/lib/theme.ts](../../src/lib/theme.ts), the single value the whole
  palette derives from.
- A change must work in both light and dark. Because both modes come from the same seed, styling
  against the tokens gives you both for free; verify both before reporting done.
- Do not introduce a build-time font or asset fetch. Fonts and Material Symbols are linked in the
  document head on purpose so the production build needs no network. Keep it that way.

## Tokens over magic numbers

- Use the shape scale (`--md-shape-*`), the type-scale classes (`.type-*`), and the elevation tokens
  (`--md-elevation-*`) rather than raw pixel values.
- Reuse the existing component classes in [../../src/app/globals.css](../../src/app/globals.css)
  (`.card`, `.chip`, `.banner`, `.segmented`, `.tab`, `.stat`, `table.data`, `.empty`, and so on)
  rather than styling a one-off with inline CSS.
- New AG Grid features extend the `.ag-theme-quartz` variable mapping in `globals.css`; do not import
  AG Grid's stock themes.

## Honesty is a design constraint

- Keep the transmission-versus-demo distinction visible. Use `chip transmission` and the primary
  container for the real science input (NASA transit depth); use `chip demo`, the tertiary container,
  and the caution banner for the MAST demo. Never restyle them to look alike, and never let a MAST
  demo read as a science result.
- The only static text is explanatory copy and the science-band annotations. Never hardcode a data
  value (a name, wavelength, count, or measurement) into the copy; it must come from the live data.
- Keep units explicit and correct: micrometres for wavelength, and the source's own recorded unit for
  the y-axis. The chart appends the unit the file declared; it never assumes one.

## Accessibility and motion

- Preserve the ARIA roles and states already in place: `role="tablist"`/`tab`/`tabpanel`,
  `aria-pressed`/`aria-selected` on toggles, `role="status"`/`role="alert"` on live regions.
- Keep focus visible: interactive controls show a `primary` focus ring on `:focus-visible`.
- Icons are decorative (`aria-hidden`) and always sit beside a text label; never carry meaning by an
  icon alone.
- Any new animation must survive `prefers-reduced-motion: reduce` (no state conveyed by motion
  alone).

## Copy

- Plain, formal language. No em dashes and no emoji anywhere, matching the repository-wide convention
  in [../../../CLAUDE.md](../../../CLAUDE.md).
