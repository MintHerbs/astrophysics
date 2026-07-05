/**
 * Lists the real MIRI LRS targets in the MAST inventory so the frontend can
 * offer a browsable picker instead of a terminal command. Grouped by
 * target_name because that is the unit the download script operates on (a
 * target may have more than one observation/visit).
 */

import { NextResponse } from "next/server";
import { readCsv, num, str } from "@/lib/server/csv";
import { MAST_INVENTORY_CSV } from "@/lib/server/paths";
import { mastDownloadedTargets } from "@/lib/server/buildDataset";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const table = readCsv(MAST_INVENTORY_CSV);
  if (!table) {
    return NextResponse.json({ targets: [], exoplanetCount: 0, totalCount: 0 });
  }

  const downloaded = mastDownloadedTargets();
  const byTarget = new Map<
    string,
    {
      target_name: string;
      classification: string | null;
      is_background_or_calibration: boolean;
      is_exoplanet: boolean;
      observation_count: number;
      wavelength_min_um: number | null;
      wavelength_max_um: number | null;
      exposure_time_s: number;
      proposal_ids: Set<string>;
    }
  >();

  for (const r of table.records) {
    const name = str(r.target_name);
    if (!name) continue;
    const isBg = String(r.is_background_or_calibration).trim().toLowerCase() === "true";
    const classification = str(r.target_classification);
    const isExoplanet = !isBg && (classification ?? "").toLowerCase().includes("exoplanet");
    if (!byTarget.has(name)) {
      byTarget.set(name, {
        target_name: name,
        classification,
        is_background_or_calibration: isBg,
        is_exoplanet: isExoplanet,
        observation_count: 0,
        wavelength_min_um: null,
        wavelength_max_um: null,
        exposure_time_s: 0,
        proposal_ids: new Set<string>(),
      });
    }
    const acc = byTarget.get(name)!;
    acc.observation_count += 1;
    const wmin = num(r.wavelength_min_um);
    const wmax = num(r.wavelength_max_um);
    if (wmin !== null) acc.wavelength_min_um = acc.wavelength_min_um === null ? wmin : Math.min(acc.wavelength_min_um, wmin);
    if (wmax !== null) acc.wavelength_max_um = acc.wavelength_max_um === null ? wmax : Math.max(acc.wavelength_max_um, wmax);
    const exp = num(r.exposure_time_s);
    if (exp !== null) acc.exposure_time_s += exp;
    const pid = str(r.proposal_id);
    if (pid) acc.proposal_ids.add(pid);
    // is_exoplanet is true if ANY of the target's rows classify as exoplanet.
    if (isExoplanet) acc.is_exoplanet = true;
  }

  const targets = [...byTarget.values()]
    .map((t) => ({
      target_name: t.target_name,
      classification: t.classification,
      is_background_or_calibration: t.is_background_or_calibration,
      is_exoplanet: t.is_exoplanet,
      observation_count: t.observation_count,
      wavelength_min_um: t.wavelength_min_um,
      wavelength_max_um: t.wavelength_max_um,
      exposure_time_s: t.exposure_time_s,
      proposal_ids: [...t.proposal_ids],
      already_downloaded: downloaded.has(t.target_name.toLowerCase()),
    }))
    .sort((a, b) => a.target_name.localeCompare(b.target_name));

  const exoplanetCount = targets.filter((t) => t.is_exoplanet).length;

  return NextResponse.json({ targets, exoplanetCount, totalCount: targets.length });
}
