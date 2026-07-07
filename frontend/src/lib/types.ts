/**
 * Types for the generated dataset JSON (src/data/nasa.json, src/data/mast.json).
 * The shape is produced by scripts/prepare-data.mjs from the real CSVs and is
 * the same for both sources so the UI can treat them uniformly.
 */

export type SourceKey = "nasa" | "mast";

export interface SpectrumPoint {
  /** Wavelength in micrometres. */
  x: number;
  /** Measured value: transit depth (NASA) or median extracted flux (MAST). */
  y: number;
  /** Lower uncertainty on y, if published. */
  errLow: number | null;
  /** Upper uncertainty on y, if published. */
  errHigh: number | null;
}

export interface MetaRow {
  label: string;
  value: string | number | null;
}

export interface Spectrum {
  id: string;
  label: string;
  /** Planet (NASA) or target (MAST) this spectrum belongs to. */
  group: string;
  instrument: string | null;
  reference_bibcode: string | null;
  reference_url: string | null;
  authors: string | null;
  note: string | null;
  wavelength_min_um: number | null;
  wavelength_max_um: number | null;
  /** Name of the source column the y values came from. */
  yColumn: string;
  /** Unit recorded for the y column in the source file, if any (for example "%" or "ppm"). */
  yUnit: string | null;
  /** Data points actually available to plot (0 if not downloaded yet). */
  pointCount: number;
  /** Published point count from the archive metadata, when known. */
  publishedPointCount: number | null;
  hasErrors: boolean;
  points: SpectrumPoint[];
  meta: MetaRow[];
}

export interface Group {
  name: string;
  spectrumCount: number;
  references: string[];
  wavelength_min_um: number | null;
  wavelength_max_um: number | null;
  points: number;
  publishedPoints: number;
}

export interface Counts {
  spectra: number;
  groups: number;
  points: number;
  catalogued: number;
  publishedPoints: number;
}

export interface SourceData {
  source: SourceKey;
  /** True when the source lists any spectra at all. */
  present: boolean;
  /** True when at least one spectrum has plottable points. */
  plottable: boolean;
  columns: {
    primary: string[];
    secondary: string[];
  };
  counts: Counts;
  groups: Group[];
  spectra: Spectrum[];
}
