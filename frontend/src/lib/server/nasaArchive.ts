/**
 * On-demand fetch of a single NASA Exoplanet Archive spectrum's data points,
 * straight from the live archive, for spectra that are catalogued but whose
 * .tbl file has not been downloaded locally (the "no points loaded" case).
 *
 * This module runs only on the Node server process, never in the browser.
 *
 * How the archive serves per-spectrum .tbl files
 * ----------------------------------------------
 * The Atmospheric Spectroscopy table's spec_path (for example
 * "82/49/11/80/K2_18_b_3.11793_5638_1.tbl") is served under a Firefly
 * workspace path:
 *
 *   https://exoplanetarchive.ipac.caltech.edu/workspace/<TMP_token>/atmospheres/tab1/data/<spec_path>
 *
 * There is no documented, permanently stable direct-download URL: the archive
 * (and the published ASTER toolkit, Hsu et al. 2026) reach these files only
 * through a Firefly session. Verified against the live service (July 2026):
 *   - GET /cgi-bin/atmospheres/nph-firefly?atmospheres mints a fresh workspace
 *     and returns its token (in the ISIS cookie and the page body).
 *   - The /workspace/<token>/atmospheres/tab1/data/ tree is shared across
 *     sessions, so any currently-valid token resolves any spec_path; an
 *     unknown token returns 404.
 * So this module mints a token once, caches it, reuses it, and re-mints once on
 * a 404 before giving up. This keeps the fetch reproducible from code, with no
 * manual wget step and no committed session URL.
 *
 * Data hygiene: nothing fetched here is written to disk. The points are held in
 * memory for the length of the request and returned to the caller. The
 * permanent, committed catalogue and the locally-downloaded .tbl files remain
 * the only on-disk data (see .claude/rules/data.md and frontend/CLAUDE.md).
 */

import { readCsv } from "./csv";
import { extractSpectrumPoints, type TblPoint } from "./ipac";
import { NASA_SPECTRA_CSV } from "./paths";

const ARCHIVE_BASE = "https://exoplanetarchive.ipac.caltech.edu";
const FIREFLY_URL = `${ARCHIVE_BASE}/cgi-bin/atmospheres/nph-firefly?atmospheres`;

/** Strict pattern for the spec_path the archive uses: hashed dirs then a .tbl. */
const SPEC_PATH_PATTERN = /^(?:[0-9]{2}\/){1,8}[A-Za-z0-9._+\-]+\.tbl$/;
/** Strict pattern for a bare .tbl basename (the spectrum id used by the UI). */
const TBL_NAME_PATTERN = /^[A-Za-z0-9._+\-]+\.tbl$/i;

const FETCH_TIMEOUT_MS = 30_000;

/** Cached Firefly workspace token, reused across requests until it 404s. */
let cachedToken: string | null = null;

export interface FetchedSpectrum {
  points: TblPoint[];
  depthColumn: string | null;
  depthUnit: string | null;
  wavelengthUnit: string | null;
  /** Total points parsed from the source file (all are returned). */
  totalPoints: number;
}

function extractToken(html: string): string | null {
  const m = /\/workspace\/(TMP_[A-Za-z0-9_]+)/.exec(html);
  return m ? m[1] : null;
}

async function getWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal, cache: "no-store" });
  } finally {
    clearTimeout(timer);
  }
}

/** Mint (or reuse) a Firefly workspace token. */
async function getToken(forceRefresh = false): Promise<string> {
  if (cachedToken && !forceRefresh) return cachedToken;
  const res = await getWithTimeout(FIREFLY_URL);
  if (!res.ok) {
    throw new Error(`Could not open an archive session (HTTP ${res.status}).`);
  }
  const token = extractToken(await res.text());
  if (!token) {
    throw new Error("Archive session opened but returned no workspace token.");
  }
  cachedToken = token;
  return token;
}

function dataUrl(token: string, specPath: string): string {
  return `${ARCHIVE_BASE}/workspace/${token}/atmospheres/tab1/data/${specPath}`;
}

/** Fetch one spectrum's raw .tbl text, minting/refreshing the token as needed. */
async function fetchTblText(specPath: string): Promise<string> {
  let token = await getToken();
  let res = await getWithTimeout(dataUrl(token, specPath));
  if (res.status === 404) {
    // Token may have expired; mint a fresh one once and retry.
    token = await getToken(true);
    res = await getWithTimeout(dataUrl(token, specPath));
  }
  if (!res.ok) {
    throw new Error(`Archive returned HTTP ${res.status} for this spectrum.`);
  }
  const text = await res.text();
  if (!text.includes("\\PL_NAME") && !text.includes("|")) {
    throw new Error("Archive response was not a recognisable IPAC table.");
  }
  return text;
}

/**
 * Resolve a spectrum id (the .tbl basename shown in the UI) to its full
 * spec_path by looking it up in the committed catalogue. Returning null means
 * the id is not in the real inventory and must not be fetched.
 */
export function resolveSpecPath(id: string): string | null {
  if (!TBL_NAME_PATTERN.test(id)) return null;
  const catalog = readCsv(NASA_SPECTRA_CSV);
  if (!catalog) return null;
  const wanted = id.toLowerCase();
  for (const r of catalog.records) {
    const specPath = String(r.SPEC_PATH ?? "").trim();
    if (!specPath) continue;
    const base = specPath.split("/").pop() ?? "";
    if (base.toLowerCase() === wanted && SPEC_PATH_PATTERN.test(specPath)) {
      return specPath;
    }
  }
  return null;
}

/**
 * Fetch and parse every point for one catalogued NASA spectrum, identified by
 * its .tbl basename. All points in the source file are returned so the full
 * spectrum can be visualised. Throws if the id is not in the inventory or the
 * archive cannot be reached.
 */
export async function fetchNasaSpectrumPoints(id: string): Promise<FetchedSpectrum> {
  const specPath = resolveSpecPath(id);
  if (!specPath) {
    throw new Error("This spectrum is not in the catalogue and cannot be fetched.");
  }
  const text = await fetchTblText(specPath);
  const parsed = extractSpectrumPoints(text);
  return {
    points: parsed.points,
    depthColumn: parsed.depthColumn,
    depthUnit: parsed.depthUnit,
    wavelengthUnit: parsed.wavelengthUnit,
    totalPoints: parsed.points.length,
  };
}
