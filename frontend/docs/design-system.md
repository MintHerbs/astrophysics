# Design system

The app is built on Material Design 3 (Material You). This document is the design language: the
colour system, the type and shape scales, elevation, motion, accessibility, and the component styles
the app ships. Read it before changing any styling or adding a component, and keep new UI expressed
in these tokens rather than ad hoc values.

The implementation lives in two files:

- [../src/lib/theme.ts](../src/lib/theme.ts): generates the colour palette from one seed colour.
- [../src/app/globals.css](../src/app/globals.css): the shape scale, type scale, elevation, and every
  component style, all expressed against the colour tokens.

## Design principles (the rules)

1. One system, two modes. Every colour is a Material colour role, not a hex literal. Because light
   and dark are both generated from the same seed, styling against the `--md-sys-color-*` tokens
   means a component works in both modes for free. Never hardcode a colour except the single seed in
   `theme.ts`.
2. Retheme from one value. The entire palette derives from `SEED_COLOR` in `theme.ts`. Changing that
   one value retints the whole app. Do not scatter colour decisions elsewhere.
3. Tokens over magic numbers. Use the shape variables (`--md-shape-*`), the type-scale classes
   (`.type-*`), and the elevation variables (`--md-elevation-*`) rather than raw pixels. A new corner
   radius or font size should almost always be an existing token.
4. Honesty is a design constraint. The transmission-versus-demo distinction (see
   [objectives.md](objectives.md)) is carried by dedicated chip and banner styles. Use `chip
   transmission` and the primary container for the real science input; use `chip demo`, the tertiary
   container, and the caution banner for the MAST demo. Do not restyle these to look alike.
5. Offline-safe. Fonts and icons are linked in the document head, not bundled through `next/font`, so
   the production build needs no network. Do not introduce a build-time font fetch.
6. Respect the user. Honour `prefers-reduced-motion`, keep focus states visible, and keep colour
   contrast on the container-versus-on-container role pairs.

## Colour: Material You dynamic palette

The palette is generated in [../src/lib/theme.ts](../src/lib/theme.ts) with Google's official
`@material/material-color-utilities`, using the `SchemeTonalSpot` scheme that Material You uses on
Android. This produces a full, coherent set of MD3 colour roles for both light and dark from a single
seed, so the theme is a real dynamic tonal palette rather than a hand-picked set.

- Seed colour: `SEED_COLOR = "#4A5BC4"`, a deep indigo chosen to evoke a night sky while producing a
  calm, high-legibility palette. This is the one and only hardcoded colour in the app.
- The generated roles are emitted as CSS custom properties named `--md-sys-color-<kebab-case>` (for
  example `--md-sys-color-primary`, `--md-sys-color-on-surface-variant`,
  `--md-sys-color-surface-container-high`).
- `buildThemeCss()` emits four blocks: `:root` (light default), a `@media (prefers-color-scheme:
  dark)` block, and explicit `:root[data-theme="light"]` and `:root[data-theme="dark"]` overrides
  that win over the system preference when the user toggles the theme.

### The colour roles in use

The generated role set (see `ROLE_NAMES` in `theme.ts`) includes the standard MD3 roles. The ones the
components rely on most:

- Primary family: `primary`, `on-primary`, `primary-container`, `on-primary-container`. Used for the
  brand accent, the chart series, links, active tab underline, stat values, filled buttons, and the
  transmission chip.
- Secondary family: `secondary-container`, `on-secondary-container`. Used for the selected state of a
  segmented button and the info banner.
- Tertiary family: `tertiary`, `tertiary-container`, `on-tertiary-container`. Used for the demo chip,
  the technosignature window annotation on the chart, and the study-column highlight.
- Error family: `error`, `error-container`, `on-error-container`. Used for the ozone reference line,
  caution banners, and error alerts.
- Surfaces: `surface`, and the tonal ladder `surface-container-lowest` through
  `surface-container-highest`, plus `surface-dim`/`surface-bright`. Cards, the app bar, table
  headers, inputs, chips, and the chart shell each pick a rung of this ladder to build depth without
  heavy shadows.
- Text and lines: `on-surface`, `on-surface-variant` (the muted text colour, exposed as `.muted`),
  `outline`, and `outline-variant` (borders and dividers).
- Inverse: `inverse-surface`, `inverse-on-surface`. Used for the chart tooltip so it reads against
  the plot area.

## Type scale

Fonts: Roboto for text, Roboto Mono for code and data, both linked in the head. The families are
exposed as `--font-sans` and `--font-mono`, each with a system fallback stack.

The type scale is a set of utility classes on top of the MD3 scale (see `globals.css`):

| Class | Size | Weight | Use |
| --- | --- | --- | --- |
| `.type-display` | `clamp(1.9rem, 1.2rem + 2vw, 2.6rem)` | 400 | Largest headings (fluid) |
| `.type-headline` | 1.5rem | 500 | Section headlines |
| `.type-title` | 1.125rem | 500 | Card and panel titles |
| `.type-body` | 0.95rem | 400 | Body text |
| `.type-label` | 0.8rem | 500 | Labels, captions, counts |
| `.muted` | inherits | - | Applies `on-surface-variant` for secondary text |

## Shape scale

Corner radii are tokens on `:root`:

| Token | Value | Typical use |
| --- | --- | --- |
| `--md-shape-xs` | 4px | Inputs, selects, inline code |
| `--md-shape-sm` | 8px | Chips, file chips, tooltips, tab top corners |
| `--md-shape-md` | 12px | Banners, stats, tables, the chart shell, the app-bar logo |
| `--md-shape-lg` | 16px | Cards, the empty state, the dropzone |
| `--md-shape-xl` | 28px | Reserved large radius |
| `--md-shape-full` | 999px | Pills: segmented buttons, icon buttons, step numbers |

## Elevation

Three tonal shadow tokens, used sparingly because depth is carried mostly by the tonal surface
ladder rather than by shadows:

- `--md-elevation-1`: raised cards (`.card.raised`).
- `--md-elevation-2`: the chart tooltip and the column-visibility dropdown.
- `--md-elevation-3`: available for the highest surfaces.

## Motion

- Interactive elements transition `background-color` and `color` over 120ms ease.
- The `spin` keyframe drives the loading spinner and any in-progress icon (`.spin-icon`).
- `@media (prefers-reduced-motion: reduce)` collapses all animation and transition durations to
  effectively zero. Any new animation must survive this rule (that is, never rely on motion to convey
  state without a static fallback).

## Accessibility

- Tabs use `role="tablist"`/`role="tab"` with `aria-selected`; the tab panel uses `role="tabpanel"`.
- Toggle-style controls (source toggle, segmented buttons, plot buttons) use `aria-pressed`, and
  groups carry `role="group"` with an `aria-label` or `aria-labelledby`.
- Status regions use `role="status"` (job progress) or `role="alert"` (load and chart errors).
- Focus is always visible: selects, search inputs, and the dropzone show a 2px `primary` outline on
  `:focus-visible`.
- Icons are decorative by default. The `Icon` component sets `aria-hidden` unless told otherwise, so
  meaning is never carried by an icon alone; there is always a text label beside it.
- `.sr-only` hides content visually while keeping it for screen readers.
- The chart legend is `aria-hidden` because the same information is in the axis labels, the tooltip,
  and the reference card.

## Component styles

All of these are defined in [../src/app/globals.css](../src/app/globals.css). Reuse them; do not
reinvent a card or a chip with inline styles.

- Layout: `.page` (max width 1200px, fluid horizontal padding), `.stack` (vertical flow with a 16px
  gap), `.row` (horizontal, wrapping), `.grid-2` (responsive two-up grid), `.divider`.
- App bar: `.app-bar` (sticky, `surface-container`), `.app-bar-brand`, `.app-bar-logo` (a filled
  primary-container tile), `.app-bar-title`, `.app-bar-sub`, `.app-bar-spacer`.
- Segmented button: `.segmented` and `.segmented-btn`, with a `.large` size, a `.filled` primary
  variant, a `:disabled` state, and selected styling via `aria-pressed="true"`/`aria-selected="true"`
  (moves to `secondary-container`). Used for the source toggle, the clean/spreadsheet switch, page
  size, and pager buttons.
- Tabs: `.tabs` and `.tab`, with a 3px bottom border that turns `primary` on the selected tab.
- Cards: `.card` (a `surface-container-low` panel with an outline), `.card.raised` (with elevation),
  `.card-title`, `.card-header` (title left, action or chip right).
- Chips: `.chip` (neutral), `.chip.transmission` (primary container, for the real science input), and
  `.chip.demo` (tertiary container, for the MAST demo). The chip variant is the primary visual signal
  of the source's meaning.
- Banners: `.banner` (neutral), `.banner.info` (secondary container, explanatory), `.banner.caution`
  (error container, the "not a science result" and failure messages).
- Icon button: `.btn-icon`, a 44px circular hit target (used for the theme toggle).
- Fields and selects: `.field` (label plus control), `.select` (a styled native `<select>` with a
  Material Symbols chevron).
- Stats: `.stat-grid` (auto-fit), `.stat`, `.stat-value` (large, `primary`), `.stat-label`.
- Tables: `.table-wrap` (a scrollable, outlined container) and `table.data` (sticky header, hover
  rows, monospace `primary` code cells). Study columns get the `.highlighted-col` class.
- Empty state: `.empty` (a dashed drop target look), `.empty-icon`, and the numbered `.steps`/`.step`
  list with `.step-num` pills.
- Code: `.code` (a block) and `code.inline` (inline), both Roboto Mono on the highest surface.
- Chart: `.chart-shell` (the lowest surface), `.chart-legend`/`.legend-item`/`.legend-swatch`, and
  `.chart-tooltip` (inverse surface with elevation).
- Disclosure: `.disclosure-header`, the expand/collapse header for the populate panels.
- Dropzone: `.dropzone`, with `:hover`/`:focus-visible` and a drag-over `.active` state, plus
  `.file-chip`/`.file-chip-list`/`.file-chip-remove` for the queued files.
- Key-value list: `.kv`, a two-column definition list for reference and provenance details.
- Spinner: `.spinner` (standalone) and `.spin-icon` (an icon in place).

## AG Grid theming

The interactive spreadsheet view uses AG Grid's Quartz theme, restyled entirely through CSS variables
so it matches the Material palette in both light and dark. The `.ag-theme-quartz` block in
`globals.css` maps AG Grid's own variables (`--ag-background-color`, `--ag-header-background-color`,
`--ag-row-hover-color`, `--ag-selected-row-background-color`, fonts, borders, radius) onto the
`--md-sys-color-*` tokens. Two highlight classes mark columns:

- `.highlighted-col`: study-relevant columns, tinted with the tertiary container (matches the
  window annotation on the chart).
- `.manual-highlighted-col`: columns the user has toggled on via the per-column palette button,
  tinted with the primary container.

If you add a grid feature, extend this theme block rather than importing AG Grid's default themes,
so the grid never diverges from the rest of the app.

## Theming and the no-flash toggle

- The light/dark toggle ([../src/components/ThemeToggle.tsx](../src/components/ThemeToggle.tsx)) sets
  `data-theme` on `<html>` and stores the choice in `localStorage`.
- `ThemeScript` ([../src/components/ThemeScript.tsx](../src/components/ThemeScript.tsx)) is a tiny
  blocking script in the body that applies the saved theme before first paint, so there is no flash
  of the wrong scheme. If nothing is saved, the `prefers-color-scheme` media query decides.
- The toggle renders a neutral icon until mounted so the server and client markup match (no hydration
  mismatch).
