import type { Spectrum } from "./types";

/**
 * Shared filter for whether a catalogued spectrum's points are already loaded
 * locally. "loaded" means at least one point is plottable now; "unloaded" means
 * the spectrum is catalogued but its data file has not been downloaded yet (the
 * "no points loaded" case), which the viewer can fetch on demand.
 */
export type PointsFilter = "all" | "loaded" | "unloaded";

export const POINTS_FILTER_OPTIONS: Array<{
  value: PointsFilter;
  label: string;
  icon: string;
}> = [
  { value: "all", label: "All", icon: "list" },
  { value: "loaded", label: "With points", icon: "show_chart" },
  { value: "unloaded", label: "No points", icon: "cloud_download" },
];

/** True when a spectrum passes the given points-availability filter. */
export function matchesPointsFilter(
  spectrum: Spectrum,
  filter: PointsFilter,
  loadedIds?: ReadonlySet<string>,
): boolean {
  const hasPoints = spectrum.pointCount > 0 || (loadedIds?.has(spectrum.id) ?? false);
  if (filter === "loaded") return hasPoints;
  if (filter === "unloaded") return !hasPoints;
  return true;
}
