/**
 * Live dataset builder: reads the real CSVs under ../data on every call and
 * shapes them into the SourceData structure the UI renders. This replaces a
 * one-shot "generate JSON" build step: because the population buttons in the
 * app add or change files under ../data at any time, the API routes call this
 * on every request instead of reading a stale snapshot.
 *
 * For NASA, the inventory (spectra.csv) and every referenced .tbl file live
 * directly under data/NASA_Archive; each spectrum's points are parsed from
 * its own .tbl file on every request (see ./ipac), not pre-built into a CSV.
 */

import fs from "node:fs";
import path from "node:path";
import type { SourceData, Spectrum, Group, MetaRow } from "@/lib/types";
import { readCsv, num, int, str, basename, minMax, uniqueOrdered, type CsvRow } from "./csv";
import { extractSpectrumPoints } from "./ipac";
import { NASA_DIR, NASA_RAW_DIR, NASA_SPECTRA_CSV, MAST_MEDIAN_CSV, MAST_INVENTORY_CSV } from "./paths";

const TBL_NAME_PATTERN = /^[A-Za-z0-9._+\-]+\.tbl$/i;

/** Locate a spectrum's .tbl file by exact basename, directly under NASA_DIR or its legacy raw/ upload folder. */
function resolveNasaTblPath(name: string): string | null {
  if (!TBL_NAME_PATTERN.test(name)) return null;
  const direct = path.join(NASA_DIR, name);
  if (fs.existsSync(direct)) return direct;
  const uploaded = path.join(NASA_RAW_DIR, name);
  if (fs.existsSync(uploaded)) return uploaded;
  return null;
}

const NASA_SECONDARY_COLUMNS = [
  "pl_name",
  "instrument",
  "spec_type",
  "facility",
  "wavelength_min_um",
  "wavelength_max_um",
  "transit_mid_min_bjd",
  "transit_mid_max_bjd",
  "num_datapoints",
  "reference_bibcode",
  "authors",
  "note",
  "spec_path",
];

const NASA_PRIMARY_COLUMNS = [
  "source_file",
  "pl_name",
  "reference_bibcode",
  "note",
  "wavelength_um",
  "depth",
  "depth_err_low",
  "depth_err_high",
  "depth_column",
  "wavelength_column",
  "depth_unit",
  "wavelength_unit",
];

export function buildNasa(): SourceData {
  const catalog = readCsv(NASA_SPECTRA_CSV);
  const records = catalog ? catalog.records : [];

  const spectra: Spectrum[] = records.map((r, i) => {
    const planet = str(r.PL_NAME) || "Unknown";
    const fileName = basename(str(r.SPEC_PATH));
    const bibcode = str(r.BIBCODE);
    const note = str(r.NOTE);
    const authors = str(r.AUTHORS);
    const id = fileName || `${planet}-row-${i}`;

    let points: Spectrum["points"] = [];
    let depthColumn = "depth";
    let depthUnit: string | null = null;
    let statusNote: string | null = null;

    if (!fileName) {
      statusNote = "This inventory row has no spec_path, so no local file can be matched.";
    } else {
      const filePath = resolveNasaTblPath(fileName);
      if (!filePath) {
        statusNote = `The local file ${fileName} was not found under data/NASA_Archive.`;
      } else {
        try {
          const text = fs.readFileSync(filePath, "utf8");
          const parsed = extractSpectrumPoints(text);
          points = parsed.points.map((p) => ({ x: p.wavelength_um, y: p.depth, errLow: p.errLow, errHigh: p.errHigh }));
          depthColumn = parsed.depthColumn ?? "depth";
          depthUnit = parsed.depthUnit;
          if (points.length === 0) {
            statusNote = `${fileName} was read but no wavelength/depth columns could be identified.`;
          }
        } catch (err) {
          statusNote = `${fileName} could not be read (${err instanceof Error ? err.message : String(err)}).`;
        }
      }
    }

    const [wmin, wmax] =
      points.length > 0 ? minMax(points.map((p) => p.x)) : [num(r.MINWAVELNG), num(r.MAXWAVELNG)];

    let label = planet;
    if (note) label = `${planet} - ${note}`;
    else if (authors) label = `${planet} - ${authors}`;

    const meta: MetaRow[] = [
      { label: "Instrument", value: str(r.INSTRUMENT) },
      { label: "Spectrum type", value: str(r.SPEC_TYPE) },
      { label: "Facility", value: str(r.FACILITY) },
      { label: "Published data points", value: int(r.NUM_DATAPOINTS) },
    ].filter((m) => m.value !== null);
    if (statusNote) meta.push({ label: "Local file status", value: statusNote });

    return {
      id,
      label,
      group: planet,
      instrument: str(r.INSTRUMENT),
      reference_bibcode: bibcode,
      reference_url: bibcode ? `https://ui.adsabs.harvard.edu/abs/${bibcode}/abstract` : null,
      authors,
      note,
      wavelength_min_um: wmin,
      wavelength_max_um: wmax,
      yColumn: depthColumn,
      yUnit: depthUnit,
      publishedPointCount: int(r.NUM_DATAPOINTS),
      pointCount: points.length,
      hasErrors: points.some((p) => p.errLow !== null && Number.isFinite(p.errLow)),
      points,
      meta,
    };
  });

  const planetNames = uniqueOrdered(records.map((r) => str(r.PL_NAME)));
  const groups: Group[] = planetNames.map((name) => {
    const rows = records.filter((r) => str(r.PL_NAME) === name);
    const spec = spectra.filter((s) => s.group === name);
    const [wmin, wmax] = minMax([...rows.map((r) => num(r.MINWAVELNG)), ...rows.map((r) => num(r.MAXWAVELNG))]);
    return {
      name,
      spectrumCount: rows.length,
      references: uniqueOrdered(rows.map((r) => str(r.BIBCODE))),
      wavelength_min_um: wmin,
      wavelength_max_um: wmax,
      points: spec.reduce((acc, s) => acc + s.pointCount, 0),
      publishedPoints: rows.reduce((acc, r) => acc + (int(r.NUM_DATAPOINTS) || 0), 0),
    };
  });

  const pointsLoaded = spectra.reduce((acc, s) => acc + s.pointCount, 0);
  const publishedPoints = spectra.reduce((acc, s) => acc + (s.publishedPointCount || 0), 0);

  return {
    source: "nasa",
    present: spectra.length > 0,
    plottable: pointsLoaded > 0,
    columns: { primary: NASA_PRIMARY_COLUMNS, secondary: NASA_SECONDARY_COLUMNS },
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
