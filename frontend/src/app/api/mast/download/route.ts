/**
 * Starts a background job that downloads the X1DINTS products for one MAST
 * target (via the existing download script), then rebuilds the median-flux
 * plot data for it. Returns immediately with a job id; poll
 * /api/jobs/[id] for progress, since a download can take minutes.
 */

import { NextResponse } from "next/server";
import { readCsv, str } from "@/lib/server/csv";
import { MAST_INVENTORY_CSV, MAST_DOWNLOAD_SCRIPT, MAST_PLOT_SCRIPT, MAST_DIR } from "@/lib/server/paths";
import { createJob, runPython, finishJob, failJob, lockTarget, unlockTarget } from "@/lib/server/jobs";
import { buildMast } from "@/lib/server/buildDataset";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function knownTargetNames(): Set<string> {
  const table = readCsv(MAST_INVENTORY_CSV);
  const names = (table?.records ?? []).map((r) => str(r.target_name)?.toLowerCase()).filter(Boolean) as string[];
  return new Set(names);
}

export async function POST(req: Request) {
  let body: { target?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Expected JSON body with a target field." }, { status: 400 });
  }
  const target = (body.target ?? "").trim();
  if (!target) {
    return NextResponse.json({ error: "Missing target." }, { status: 400 });
  }
  if (!knownTargetNames().has(target.toLowerCase())) {
    return NextResponse.json({ error: "Unknown target name." }, { status: 404 });
  }
  if (!lockTarget(target)) {
    return NextResponse.json({ error: "A download for this target is already running." }, { status: 409 });
  }

  const job = createJob();

  (async () => {
    try {
      await runPython(MAST_DOWNLOAD_SCRIPT, [target], MAST_DIR, job);
      await runPython(MAST_PLOT_SCRIPT, [], MAST_DIR, job);
      finishJob(job, buildMast());
    } catch (err) {
      failJob(job, err);
    } finally {
      unlockTarget(target);
    }
  })();

  return NextResponse.json({ jobId: job.id }, { status: 202 });
}
