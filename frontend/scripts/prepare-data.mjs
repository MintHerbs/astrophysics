/*
 * prepare-data.mjs
 * ================
 * Read the real dataset CSVs under ../data and write the JSON the web app
 * imports (src/data/nasa.json and src/data/mast.json). The app reads only from
 * that generated JSON; it never contains anything not present in the CSVs.
 *
 * Sources
 * -------
 * NASA Exoplanet Archive (reduced transmission spectra, the pipeline input):
 *   ../data/NASA_Archive/nasa_miri_spectra.csv        (inventory, one row per published spectrum)
 *   ../data/NASA_Archive/nasa_miri_spectra_points.csv (one row per spectral point, may be header-only)
 * MAST (extracted stellar flux demo, NOT a transmission spectrum):
 *   ../data/MAST/mast_median_spectra.csv              (one row per observation and wavelength point)
 *   ../data/MAST/mast_miri_inventory.csv              (inventory, joined for provenance)
 *
 * Either source may be empty. The script always writes valid JSON so the app
 * builds and shows a clear, source-specific empty state.
 *
 * Run with: npm run prepare-data  (also runs automatically before dev and build).
 */

import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIR = path.resolve(SCRIPT_DIR, "..");
const REPO_ROOT = path.resolve(FRONTEND_DIR, "..");
const DATA_DIR = path.resolve(REPO_ROOT, "data");
const OUT_DIR = path.resolve(FRONTEND_DIR, "src", "data");

const NASA_INVENTORY = path.join(DATA_DIR, "NASA_Archive", "nasa_miri_spectra.csv");
const NASA_POINTS = path.join(DATA_DIR, "NASA_Archive", "nasa_miri_spectra_points.csv");
const MAST_MEDIAN = path.join(DATA_DIR, "MAST", "mast_median_spectra.csv");
const MAST_INVENTORY = path.join(DATA_DIR, "MAST", "mast_miri_inventory.csv");

/* ------------------------- CSV parsing (RFC 4180) ------------------------- */

function parseCsv(text) {
  const rows = [];
  let field = "";
  let record = [];
  let inQuotes = false;
  let i = 0;
  const n = text.length;
  const pushField = () => {
    record.push(field);
    field = "";
  };
  const pushRecord = () => {
    pushField();
    rows.push(record);
    record = [];
  };
  while (i < n) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ",") {
      pushField();
      i += 1;
      continue;
    }
    if (ch === "\r") {
      i += 1;
      continue;
    }
    if (ch === "\n") {
      pushRecord();
      i += 1;
      continue;
    }
    field += ch;
    i += 1;
  }
  // Flush any trailing field/record that did not end with a newline.
  if (field.length > 0 || record.length > 0) {
    pushRecord();
  }
  return rows;
}

function readCsv(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const text = fs.readFileSync(filePath, "utf8");
  const rows = parseCsv(text).filter((r) => r.length > 1 || (r.length === 1 && r[0] !== ""));
  if (rows.length === 0) {
    return { header: [], records: [] };
  }
  const header = rows[0];
  const records = rows.slice(1).map((cells) => {
    const obj = {};
    header.forEach((key, idx) => {
      obj[key] = cells[idx] !== undefined ? cells[idx] : "";
    });
    return obj;
  });
  return { header, records };
}

/* ------------------------------ helpers ---------------------------------- */

const num = (v) => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (s === "" || s.toLowerCase() === "nan" || s.toLowerCase() === "na") return null;
  const x = Number(s);
  return Number.isFinite(x) ? x : null;
};

const int = (v) => {
  const x = num(v);
  return x === null ? null : Math.round(x);
};

const str = (v) => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
};

const basename = (p) => {
  if (!p) return null;
  const clean = String(p).replace(/\\/g, "/");
  const parts = clean.split("/");
  return parts[parts.length - 1] || null;
};

const minMax = (values) => {
  const finite = values.filter((x) => x !== null && Number.isFinite(x));
  if (finite.length === 0) return [null, null];
  return [Math.min(...finite), Math.max(...finite)];
};

const uniqueOrdered = (values) => {
  const seen = new Set();
  const out = [];
  for (const v of values) {
    if (v && !seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
};

/* --------------------------------- NASA ---------------------------------- */

function buildNasa() {
  const inventory = readCsv(NASA_INVENTORY);
  const pointsTable = readCsv(NASA_POINTS);

  const invHeader = inventory ? inventory.header : [];
  const invRecords = inventory ? inventory.records : [];
  const pointsHeader = pointsTable ? pointsTable.header : [];
  const pointsRecords = pointsTable ? pointsTable.records : [];

  // Group points by their source .tbl file name.
  const pointsByFile = new Map();
  for (const r of pointsRecords) {
    const key = str(r.source_file);
    if (!key) continue;
    if (!pointsByFile.has(key)) pointsByFile.set(key, []);
    const wl = num(r.wavelength_um);
    const depth = num(r.depth);
    if (wl === null || depth === null) continue;
    pointsByFile.get(key).push({
      x: wl,
      y: depth,
      errLow: num(r.depth_err_low),
      errHigh: num(r.depth_err_high),
      depthColumn: str(r.depth_column),
    });
  }
  for (const arr of pointsByFile.values()) arr.sort((a, b) => a.x - b.x);

  const spectra = invRecords.map((r) => {
    const id = basename(r.spec_path) || `${str(r.pl_name)}`;
    const planet = str(r.pl_name) || "Unknown";
    const filePoints = pointsByFile.get(id) || [];
    const yColumn = filePoints.length > 0 && filePoints[0].depthColumn
      ? filePoints[0].depthColumn
      : "depth";
    const [wmin, wmax] = filePoints.length > 0
      ? minMax(filePoints.map((p) => p.x))
      : [num(r.wavelength_min_um), num(r.wavelength_max_um)];
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
      yColumn,
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

  // Group by planet.
  const planetNames = uniqueOrdered(invRecords.map((r) => str(r.pl_name)));
  const groups = planetNames.map((name) => {
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
    columns: {
      primary: pointsHeader,
      secondary: invHeader,
    },
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

/* --------------------------------- MAST ---------------------------------- */

function buildMast() {
  const median = readCsv(MAST_MEDIAN);
  const inventory = readCsv(MAST_INVENTORY);

  const medianHeader = median ? median.header : [];
  const medianRecords = median ? median.records : [];
  const invHeader = inventory ? inventory.header : [];
  const invRecords = inventory ? inventory.records : [];

  const invByObs = new Map();
  for (const r of invRecords) {
    const key = str(r.obs_id);
    if (key) invByObs.set(key, r);
  }

  // Group median points by observation.
  const byObs = new Map();
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
    byObs.get(obs).points.push({ x: wl, y: flux });
  }

  const spectra = [...byObs.values()].map((o) => {
    o.points.sort((a, b) => a.x - b.x);
    const [wmin, wmax] = minMax(o.points.map((p) => p.x));
    const inv = invByObs.get(o.observation);
    const meta = [];
    if (o.nIntegrations !== null) meta.push({ label: "Integrations pooled", value: o.nIntegrations });
    if (inv) {
      const rows = [
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
      publishedPointCount: o.points.length,
      pointCount: o.points.length,
      hasErrors: false,
      points: o.points.map((p) => ({ x: p.x, y: p.y, errLow: null, errHigh: null })),
      meta,
    };
  });

  const targetNames = uniqueOrdered(spectra.map((s) => s.group));
  const groups = targetNames.map((name) => {
    const spec = spectra.filter((s) => s.group === name);
    const [wmin, wmax] = minMax([
      ...spec.map((s) => s.wavelength_min_um),
      ...spec.map((s) => s.wavelength_max_um),
    ]);
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
    columns: {
      primary: medianHeader,
      secondary: invHeader,
    },
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

/* --------------------------------- main ---------------------------------- */

function writeJson(name, data) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const out = path.join(OUT_DIR, name);
  fs.writeFileSync(out, JSON.stringify(data, null, 2) + "\n", "utf8");
  return out;
}

function relToRepo(p) {
  return path.relative(REPO_ROOT, p).replace(/\\/g, "/");
}

function main() {
  const nasa = buildNasa();
  const mast = buildMast();

  writeJson("nasa.json", nasa);
  writeJson("mast.json", mast);

  console.log("prepare-data: wrote src/data/nasa.json and src/data/mast.json");
  console.log(
    `  NASA  (${relToRepo(NASA_POINTS)}): ` +
      `${nasa.counts.spectra} catalogued spectra, ${nasa.counts.groups} planets, ` +
      `${nasa.counts.points} plottable points` +
      (nasa.plottable ? "" : " (points CSV is empty; run the .tbl download and build step)")
  );
  console.log(
    `  MAST  (${relToRepo(MAST_MEDIAN)}): ` +
      `${mast.counts.spectra} observations, ${mast.counts.groups} targets, ${mast.counts.points} points` +
      (mast.present ? "" : " (median CSV is empty; download a product and run plot_mast_spectrum.py)")
  );
}

main();
