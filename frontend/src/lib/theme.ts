/**
 * Material Design 3 (Material You) dynamic colour.
 *
 * The whole palette is generated from a single seed colour with Google's
 * official Material Color Utilities library, using the tonal-spot scheme that
 * Material You uses on Android. This yields a coherent set of MD3 colour roles
 * (primary, containers, tonal surfaces, and so on) for both light and dark, so
 * the theme is a real dynamic tonal palette rather than a hand-picked set.
 *
 * The generated roles are emitted as CSS custom properties (--md-sys-color-*)
 * that the rest of the app styles against. Light is the default; dark is applied
 * either by the system preference or by an explicit data-theme attribute set by
 * the theme toggle.
 */

import {
  argbFromHex,
  hexFromArgb,
  Hct,
  SchemeTonalSpot,
  MaterialDynamicColors,
} from "@material/material-color-utilities";

// Seed colour: a deep indigo, chosen to evoke a night sky while producing a
// calm, high-legibility Material You palette. Change this one value to retheme.
export const SEED_COLOR = "#4A5BC4";

// The MD3 colour roles emitted as CSS variables, in camelCase as exposed by
// MaterialDynamicColors. Each becomes --md-sys-color-<kebab-case>.
const ROLE_NAMES = [
  "primary",
  "onPrimary",
  "primaryContainer",
  "onPrimaryContainer",
  "secondary",
  "onSecondary",
  "secondaryContainer",
  "onSecondaryContainer",
  "tertiary",
  "onTertiary",
  "tertiaryContainer",
  "onTertiaryContainer",
  "error",
  "onError",
  "errorContainer",
  "onErrorContainer",
  "background",
  "onBackground",
  "surface",
  "onSurface",
  "surfaceVariant",
  "onSurfaceVariant",
  "outline",
  "outlineVariant",
  "shadow",
  "scrim",
  "inverseSurface",
  "inverseOnSurface",
  "inversePrimary",
  "surfaceDim",
  "surfaceBright",
  "surfaceContainerLowest",
  "surfaceContainerLow",
  "surfaceContainer",
  "surfaceContainerHigh",
  "surfaceContainerHighest",
] as const;

const kebab = (name: string) =>
  name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

function schemeVars(isDark: boolean): Record<string, string> {
  const source = Hct.fromInt(argbFromHex(SEED_COLOR));
  const scheme = new SchemeTonalSpot(source, isDark, 0);
  const vars: Record<string, string> = {};
  for (const name of ROLE_NAMES) {
    // MaterialDynamicColors exposes each role as a static DynamicColor getter.
    const role = (MaterialDynamicColors as unknown as Record<string, { getArgb: (s: unknown) => number }>)[name];
    if (role && typeof role.getArgb === "function") {
      vars[`--md-sys-color-${kebab(name)}`] = hexFromArgb(role.getArgb(scheme));
    }
  }
  return vars;
}

const declarations = (vars: Record<string, string>) =>
  Object.entries(vars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n");

/**
 * The full theme stylesheet: light as the default, dark by system preference,
 * and an explicit data-theme override that wins over the system preference.
 */
export function buildThemeCss(): string {
  const light = schemeVars(false);
  const dark = schemeVars(true);
  return [
    `:root {\n${declarations(light)}\n  color-scheme: light;\n}`,
    `@media (prefers-color-scheme: dark) {\n  :root {\n${declarations(dark)}\n    color-scheme: dark;\n  }\n}`,
    `:root[data-theme="light"] {\n${declarations(light)}\n  color-scheme: light;\n}`,
    `:root[data-theme="dark"] {\n${declarations(dark)}\n  color-scheme: dark;\n}`,
  ].join("\n\n");
}
