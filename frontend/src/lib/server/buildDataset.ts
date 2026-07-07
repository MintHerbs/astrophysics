/**
 * Live dataset builder: reads the real CSVs under ../data on every call and
 * shapes them into the SourceData structure the UI renders. This replaces a
 * one-shot "generate JSON" build step: because the population buttons in the
 * app add or change files under ../data at any time, the API routes call this
 * on every request instead of reading a stale snapshot.
 */

import type { SourceData, Spectrum, Group } from "@/lib/types";
import { readCsv, num, int, str, basename, minMax, uniqueOrdered, type CsvRow } from "./csv";
import { NASA_INVENTORY_CSV, NASA_POINTS_CSV, MAST_MEDIAN_CSV, MAST_INVENTORY_CSV } from "./paths";

interface NasaFilePoints {
  x: number;
  y: number;
  errLow: number | null;
  errHigh: number | null;
  depthColumn: string | null;
}

interface NasaFileIdentity {
  planet: string | null;
  bibcode: string | null;
  note: string | null;
  depthUnit: string | null;
}

/**
 * Find the uploaded points file, if any, that belongs to one inventory row.
 *
 * A real download's file name never matches the inventory's spec_path (that is
 * an archive-internal workspace path, not what "Download All Checked Spectra"
 * actually names the file), so file name is tried first but is expected to
 * miss. The reliable signal is the PL_NAME and REFERENCE keywords embedded in
 * every real per-spectrum .tbl (verified against a real download), matched
 * against this row's planet and authors. Because most planets here have more
 * than one spectrum from the very same paper (different reduction pipelines,
 * distinguished only by the inventory's note column), the embedded NOTE
 * keyword is used to disambiguate those siblings when present; ties that
 * still cannot be told apart fall back to a stable, order-based pairing so a
 * file is never silently dropped, at the cost of possibly pairing it with the
 * wrong sibling pipeline when the archive did not label it distinctly.
 */
function matchNasaFile(
  row: CsvRow,
  specPathId: string | null,
  planet: string,
  pointsByFile: Map<string, NasaFilePoints[]>,
  identityByFile: Map<string, NasaFileIdentity>,
  claimed: Set<string>,
): string | null {
  if (specPathId && pointsByFile.has(specPathId) && !claimed.has(specPathId)) {
    return specPathId;
  }
  const rowBibcode = str(row.reference_bibcode)?.toLowerCase() ?? null;
  const rowNote = str(row.note)?.trim().toLowerCase() ?? null;
  if (!rowBibcode) return null;

  const candidates = [...identityByFile.entries()].filter(
    ([file, id]) =>
      !claimed.has(file) &&
      id.planet?.toLowerCase() === planet.toLowerCase() &&
      id.bibcode?.toLowerCase() === rowBibcode,
  );
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0][0];

  const noteMatch = candidates.find(([, id]) => (id.note?.trim().toLowerCase() ?? null) === rowNote);
  if (noteMatch) return noteMatch[0];

  // Ambiguous: multiple unclaimed files share this planet and paper, and none
  // carries a NOTE that matches this row's pipeline label. Pair deterministically
  // rather than dropping the file.
  return candidates[0][0];
}

export function buildNasa(): SourceData {
  const inventory = readCsv(NASA_INVENTORY_CSV);
  const pointsTable = readCsv(NASA_POINTS_CSV);

  const invHeader = inventory ? inventory.header : [];
  const invRecords = inventory ? inventory.records : [];
  const pointsHeader = pointsTable ? pointsTable.header : [];
  const pointsRecords = pointsTable ? pointsTable.records : [];

  const pointsByFile = new Map<string, NasaFilePoints[]>();
  const identityByFile = new Map<string, NasaFileIdentity>();
  for (const r of pointsRecords) {
    const key = str(r.source_file);
    if (!key) continue;
    if (!pointsByFile.has(key)) pointsByFile.set(key, []);
    if (!identityByFile.has(key)) {
      identityByFile.set(key, {
        planet: str(r.pl_name),
        bibcode: str(r.reference_bibcode),
        note: str(r.note),
        depthUnit: str(r.depth_unit),
      });
    }
    const wl = num(r.wavelength_um);
    const depth = num(r.depth);
    if (wl === null || depth === null) continue;
    pointsByFile.get(key)!.push({
      x: wl,
      y: depth,
      errLow: num(r.depth_err_low),
      errHigh: num(r.depth_err_high),
      depthColumn: str(r.depth_column),
    });
  }
  for (const arr of pointsByFile.values()) arr.sort((a, b) => a.x - b.x);

  const claimedFiles = new Set<string>();
  const spectra: Spectrum[] = invRecords.map((r: CsvRow) => {
    const specPathId = basename(r.spec_path);
    const planet = str(r.pl_name) || "Unknown";
    const fileKey = matchNasaFile(r, specPathId, planet, pointsByFile, identityByFile, claimedFiles);
    if (fileKey) claimedFiles.add(fileKey);
    const id = specPathId || fileKey || planet;
    const filePoints = fileKey ? pointsByFile.get(fileKey) || [] : [];
    const identity = fileKey ? identityByFile.get(fileKey) : undefined;
    const [wmin, wmax] =
      filePoints.length > 0 ? minMax(filePoints.map((p) => p.x)) : [num(r.wavelength_min_um), num(r.wavelength_max_um)];
    const note = str(r.note);
    const authors = str(r.authors);
    let label = planet;
    if (note) label = `${planet} - ${note}`;
    else if (authors) label = `${planet} - ${authors}`;
    return {
      id,
      label,
      group: planet,
      instrument: str(r.instrument),
      reference_bibcode: str(r.reference_bibcode),
      reference_url: str(r.reference_url),
      authors,
      note,
      wavelength_min_um: wmin,
      wavelength_max_um: wmax,
      yColumn: filePoints.length > 0 && filePoints[0].depthColumn ? filePoints[0].depthColumn! : "depth",
      yUnit: identity?.depthUnit ?? null,
      publishedPointCount: int(r.num_datapoints),
      pointCount: filePoints.length,
      hasErrors: filePoints.some((p) => p.errLow !== null && Number.isFinite(p.errLow)),
      points: filePoints.map((p) => ({ x: p.x, y: p.y, errLow: p.errLow, errHigh: p.errHigh })),
      meta: [
        { label: "Instrument", value: str(r.instrument) },
        { label: "Spectrum type", value: str(r.spec_type) },
        { label: "Facility", value: str(r.facility) },
        { label: "Published data points", value: int(r.num_datapoints) },
      ].filter((m) => m.value !== null),
    };
  });

  const planetNames = uniqueOrdered(invRecords.map((r) => str(r.pl_name)));
  const groups: Group[] = planetNames.map((name) => {
    const rows = invRecords.filter((r) => str(r.pl_name) === name);
    const spec = spectra.filter((s) => s.group === name);
    const [wmin, wmax] = minMax([
      ...rows.map((r) => num(r.wavelength_min_um)),
      ...rows.map((r) => num(r.wavelength_max_um)),
    ]);
    return {
      name,
      spectrumCount: rows.length,
      references: uniqueOrdered(rows.map((r) => str(r.reference_bibcode))),
      wavelength_min_um: wmin,
      wavelength_max_um: wmax,
      points: spec.reduce((acc, s) => acc + s.pointCount, 0),
      publishedPoints: rows.reduce((acc, r) => acc + (int(r.num_datapoints) || 0), 0),
    };
  });

  const pointsLoaded = spectra.reduce((acc, s) => acc + s.pointCount, 0);
  const publishedPoints = spectra.reduce((acc, s) => acc + (s.publishedPointCount || 0), 0);

  return {
    source: "nasa",
    present: spectra.length > 0,
    plottable: pointsLoaded > 0,
    columns: { primary: pointsHeader, secondary: invHeader },
    counts: {
      spectra: spectra.length,
      groups: groups.length,
      points: pointsLoaded,
      catalogued: spectra.length,
      publishedPoints,
    },
    groups,
    spectra,
  };
}

export function buildMast(): SourceData {
  const median = readCsv(MAST_MEDIAN_CSV);
  const inventory = readCsv(MAST_INVENTORY_CSV);

  const medianHeader = median ? median.header : [];
  const medianRecords = median ? median.records : [];
  const invHeader = inventory ? inventory.header : [];
  const invRecords = inventory ? inventory.records : [];

  const invByObs = new Map<string, CsvRow>();
  for (const r of invRecords) {
    const key = str(r.obs_id);
    if (key) invByObs.set(key, r);
  }

  interface ObsAcc {
    observation: string;
    target: string;
    nIntegrations: number | null;
    points: Array<{ x: number; y: number }>;
  }
  const byObs = new Map<string, ObsAcc>();
  for (const r of medianRecords) {
    const obs = str(r.observation);
    if (!obs) continue;
    const wl = num(r.wavelength_um);
    const flux = num(r.median_flux);
    if (wl === null || flux === null) continue;
    if (!byObs.has(obs)) {
      byObs.set(obs, {
        observation: obs,
        target: str(r.target) || "Unknown",
        nIntegrations: int(r.n_integrations),
        points: [],
      });
    }
    byObs.get(obs)!.points.push({ x: wl, y: flux });
  }

  const spectra: Spectrum[] = [...byObs.values()].map((o) => {
    o.points.sort((a, b) => a.x - b.x);
    const [wmin, wmax] = minMax(o.points.map((p) => p.x));
    const inv = invByObs.get(o.observation);
    const meta: Spectrum["meta"] = [];
    if (o.nIntegrations !== null) meta.push({ label: "Integrations pooled", value: o.nIntegrations });
    if (inv) {
      const rows: Array<[string, string | number | null]> = [
        ["Instrument", str(inv.instrument_name)],
        ["Disperser", str(inv.filter_disperser)],
        ["Observation mode", str(inv.observation_mode)],
        ["Target classification", str(inv.target_classification)],
        ["Exposure time (s)", num(inv.exposure_time_s)],
        ["Programme", str(inv.proposal_id)],
        ["Principal investigator", str(inv.proposal_pi)],
        ["Programme title", str(inv.obs_title)],
        ["Release date (UTC)", str(inv.release_date_utc)],
      ];
      for (const [label, value] of rows) {
        if (value !== null) meta.push({ label, value });
      }
    }
    return {
      id: o.observation,
      label: `${o.target} (${o.observation})`,
      group: o.target,
      instrument: inv ? str(inv.instrument_name) : "MIRI/SLITLESS",
      reference_bibcode: null,
      reference_url: inv ? str(inv.product_download_url) : null,
      authors: inv ? str(inv.proposal_pi) : null,
      note: inv ? str(inv.obs_title) : null,
      wavelength_min_um: wmin,
      wavelength_max_um: wmax,
      yColumn: "median_flux",
      yUnit: null,
      publishedPointCount: o.points.length,
      pointCount: o.points.length,
      hasErrors: false,
      points: o.points.map((p) => ({ x: p.x, y: p.y, errLow: null, errHigh: null })),
      meta,
    };
  });

  const targetNames = uniqueOrdered(spectra.map((s) => s.group));
  const groups: Group[] = targetNames.map((name) => {
    const spec = spectra.filter((s) => s.group === name);
    const [wmin, wmax] = minMax([...spec.map((s) => s.wavelength_min_um), ...spec.map((s) => s.wavelength_max_um)]);
    return {
      name,
      spectrumCount: spec.length,
      references: [],
      wavelength_min_um: wmin,
      wavelength_max_um: wmax,
      points: spec.reduce((acc, s) => acc + s.pointCount, 0),
      publishedPoints: spec.reduce((acc, s) => acc + s.pointCount, 0),
    };
  });

  const pointsLoaded = spectra.reduce((acc, s) => acc + s.pointCount, 0);

  return {
    source: "mast",
    present: spectra.length > 0,
    plottable: pointsLoaded > 0,
    columns: { primary: medianHeader, secondary: invHeader },
    counts: {
      spectra: spectra.length,
      groups: groups.length,
      points: pointsLoaded,
      catalogued: spectra.length,
      publishedPoints: pointsLoaded,
    },
    groups,
    spectra,
  };
}

/** Distinct target names already reflected in the plottable MAST median CSV. */
export function mastDownloadedTargets(): Set<string> {
  const median = readCsv(MAST_MEDIAN_CSV);
  const names = (median?.records ?? []).map((r) => str(r.target)?.toLowerCase()).filter(Boolean) as string[];
  return new Set(names);
}
