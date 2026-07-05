/** Small formatting helpers for numbers and wavelength ranges. */

export function fmtNumber(value: number | null | undefined, digits = 3): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "-";
  return value.toLocaleString("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  });
}

export function fmtInt(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "-";
  return Math.round(value).toLocaleString("en-US");
}

export function fmtRange(
  min: number | null | undefined,
  max: number | null | undefined,
  unit = "um",
): string {
  if (min === null || min === undefined || max === null || max === undefined) return "-";
  return `${fmtNumber(min, 2)} to ${fmtNumber(max, 2)} ${unit}`;
}

/** Format a possibly-string meta value for display. */
export function fmtMeta(value: string | number | null): string {
  if (value === null) return "-";
  if (typeof value === "number") return fmtNumber(value, 3);
  return value;
}
