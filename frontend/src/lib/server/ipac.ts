/**
 * Minimal reader for the NASA Exoplanet Archive's per-spectrum IPAC Table
 * Format (.tbl) files. Columns are fixed-width, delimited by pipes across up
 * to four header rows (name, data type, unit, null value); data rows carry no
 * pipes and are sliced at the same character offsets as the name row. Lines
 * starting with a backslash are comments or "\KEYWORD = value" assignments
 * and are never data. This mirrors the column-matching heuristics in
 * data/NASA_Archive/build_nasa_spectra_dataset.py so the two readers agree.
 */

export interface IpacTable {
  /** Column names, in file order. */
  columns: string[];
  /** Header rows after the name row (type, unit, null), each sliced into one cell per column. */
  headerRows: string[][];
  /** Data rows, each sliced into one cell per column, in file order. */
  rows: string[][];
  /** Keyword values from "\KEY = value" lines (quotes stripped). */
  keywords: Record<string, string>;
}

function pipePositions(line: string): number[] {
  const positions: number[] = [];
  for (let i = 0; i < line.length; i++) {
    if (line[i] === "|") positions.push(i);
  }
  return positions;
}

function sliceByPositions(line: string, positions: number[]): string[] {
  const cells: string[] = [];
  for (let i = 0; i < positions.length - 1; i++) {
    const start = positions[i] + 1;
    const end = i === positions.length - 2 ? line.length : positions[i + 1];
    cells.push(line.slice(start, end).trim());
  }
  return cells;
}

const KEYWORD_LINE = /^\\\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/;

export function parseIpacTable(text: string): IpacTable {
  const lines = text.split(/\r?\n/);
  const keywords: Record<string, string> = {};
  const headerLineIndexes: number[] = [];

  lines.forEach((line, idx) => {
    if (line.startsWith("\\")) {
      const m = KEYWORD_LINE.exec(line);
      if (m) {
        let value = m[2].trim();
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        keywords[m[1].trim()] = value;
      }
      return;
    }
    if (line.startsWith("|")) headerLineIndexes.push(idx);
  });

  if (headerLineIndexes.length === 0) {
    return { columns: [], headerRows: [], rows: [], keywords };
  }

  const nameLine = lines[headerLineIndexes[0]];
  const positions = pipePositions(nameLine);
  const columns = sliceByPositions(nameLine, positions);
  const headerRows = headerLineIndexes.slice(1).map((idx) => sliceByPositions(lines[idx], positions));

  const lastHeaderIdx = headerLineIndexes[headerLineIndexes.length - 1];
  const rows: string[][] = [];
  for (let idx = lastHeaderIdx + 1; idx < lines.length; idx++) {
    const line = lines[idx];
    if (line.trim() === "" || line.startsWith("\\") || line.startsWith("|")) continue;
    rows.push(sliceByPositions(line, positions));
  }

  return { columns, headerRows, rows, keywords };
}

const WAVELENGTH_HINTS = ["wavelength", "wave", "lambda", "wavelng", "wl", "micron"];
const DEPTH_HINTS = ["depth", "transit", "rprs", "rp_rs", "rp/rs", "trandep", "flux", "ppm", "fp_fs", "dppm"];
const ERROR_HINTS = ["err", "unc", "sigma", "_e", "error"];

function pickColumn(columns: string[], hints: string[], exclude: Set<string>): string | null {
  for (const c of columns) {
    if (exclude.has(c)) continue;
    const lc = c.toLowerCase();
    if (hints.some((h) => lc.includes(h))) return c;
  }
  return null;
}

const NUMERIC_NULLS = new Set(["", "null", "nan", "na", "-", "--"]);

function toNumber(v: string | undefined): number | null {
  if (v === undefined) return null;
  const s = v.trim();
  if (NUMERIC_NULLS.has(s.toLowerCase())) return null;
  const x = Number(s);
  return Number.isFinite(x) ? x : null;
}

export interface TblPoint {
  wavelength_um: number;
  depth: number;
  errLow: number | null;
  errHigh: number | null;
}

export interface TblParseResult {
  points: TblPoint[];
  depthColumn: string | null;
  wavelengthColumn: string | null;
  depthUnit: string | null;
  wavelengthUnit: string | null;
  planet: string | null;
  bibcode: string | null;
  note: string | null;
}

/** Parse one .tbl file's text into tidy spectral points, matching wavelength/depth/error columns by name. */
export function extractSpectrumPoints(text: string): TblParseResult {
  const table = parseIpacTable(text);
  const planet = table.keywords.PL_NAME ?? null;
  const bibcode = table.keywords.REFERENCE ?? null;
  const note = table.keywords.NOTE ?? null;

  const wlCol = pickColumn(table.columns, WAVELENGTH_HINTS, new Set());
  const depthCol = pickColumn(table.columns, DEPTH_HINTS, new Set(wlCol ? [wlCol] : []));
  if (!wlCol || !depthCol) {
    return {
      points: [],
      depthColumn: depthCol,
      wavelengthColumn: wlCol,
      depthUnit: null,
      wavelengthUnit: null,
      planet,
      bibcode,
      note,
    };
  }
  const errCol = pickColumn(table.columns, ERROR_HINTS, new Set([wlCol, depthCol]));

  const wlIdx = table.columns.indexOf(wlCol);
  const depthIdx = table.columns.indexOf(depthCol);
  const errIdx = errCol ? table.columns.indexOf(errCol) : -1;

  const points: TblPoint[] = [];
  for (const cells of table.rows) {
    const wavelength_um = toNumber(cells[wlIdx]);
    const depth = toNumber(cells[depthIdx]);
    if (wavelength_um === null || depth === null) continue;
    const errRaw = errIdx >= 0 ? toNumber(cells[errIdx]) : null;
    const err = errRaw === null ? null : Math.abs(errRaw);
    points.push({ wavelength_um, depth, errLow: err, errHigh: err });
  }
  points.sort((a, b) => a.wavelength_um - b.wavelength_um);

  // headerRows order (after the name row) is [type, unit, null] when all four IPAC
  // header rows are present; the unit row is therefore index 1 when it exists.
  const unitsRow = table.headerRows.length >= 2 ? table.headerRows[1] : null;
  const depthUnit = unitsRow ? unitsRow[depthIdx]?.trim() || null : null;
  const wavelengthUnit = unitsRow ? unitsRow[wlIdx]?.trim() || null : null;

  return { points, depthColumn: depthCol, wavelengthColumn: wlCol, depthUnit, wavelengthUnit, planet, bibcode, note };
}
