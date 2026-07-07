/**
 * Reports the download size for a MAST target without downloading anything,
 * by running the existing downloader script's --dry-run mode. This lets the
 * UI show a real, verified size (never an estimate) before committing to a
 * multi-gigabyte download.
 */

import { NextResponse } from "next/server";
import { readCsv, str } from "@/lib/server/csv";
import { MAST_INVENTORY_CSV, MAST_DOWNLOAD_SCRIPT, MAST_DIR } from "@/lib/server/paths";
import { createJob, runPython } from "@/lib/server/jobs";

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
    return NextResponse.json({ ok: false, error: "Expected JSON body with a target field." }, { status: 400 });
  }
  const target = (body.target ?? "").trim();
  if (!target) {
    return NextResponse.json({ ok: false, error: "Missing target." }, { status: 400 });
  }
  if (!knownTargetNames().has(target.toLowerCase())) {
    return NextResponse.json({ ok: false, error: "Unknown target name." }, { status: 404 });
  }

  const job = createJob();
  try {
    await runPython(MAST_DOWNLOAD_SCRIPT, [target, "--dry-run"], MAST_DIR, job);
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err), log: job.log },
      { status: 500 },
    );
  }

  const text = job.log.join("\n");
  const match = text.match(/(\d+)\s+product file\(s\),\s*([\d.]+)\s*GB total/i);
  const fileCount = match ? Number(match[1]) : null;
  const totalGb = match ? Number(match[2]) : null;

  return NextResponse.json({ ok: true, fileCount, totalGb, log: job.log });
}
