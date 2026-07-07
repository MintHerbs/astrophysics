/**
 * Accepts .tbl spectrum files downloaded by hand from the NASA Exoplanet
 * Archive's Atmospheric Spectroscopy (Firefly) interface, saves them into
 * data/NASA_Archive/raw/, then runs the existing build script to parse them
 * into the points CSV. This automates everything after the manual archive
 * download (which has no stable programmatic URL; see
 * data/NASA_Archive/raw/README.md).
 */

import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { NASA_RAW_DIR, NASA_BUILD_SCRIPT, NASA_DIR } from "@/lib/server/paths";
import { createJob, runPython } from "@/lib/server/jobs";
import { buildNasa } from "@/lib/server/buildDataset";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILES = 100;
const MAX_FILE_BYTES = 5 * 1024 * 1024; // .tbl spectra are small text tables

function safeBasename(name: string): string | null {
  const base = path.basename(name.replace(/\\/g, "/"));
  if (!base || base === "." || base === "..") return null;
  if (!/^[A-Za-z0-9._+\-]+\.tbl$/i.test(base)) return null;
  return base;
}

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Expected multipart/form-data." }, { status: 400 });
  }

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ ok: false, error: "No files received." }, { status: 400 });
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json({ ok: false, error: `Too many files (max ${MAX_FILES}).` }, { status: 400 });
  }

  const job = createJob();
  fs.mkdirSync(NASA_RAW_DIR, { recursive: true });

  const saved: string[] = [];
  const skipped: string[] = [];
  for (const file of files) {
    const name = safeBasename(file.name);
    if (!name) {
      skipped.push(`${file.name} (not a .tbl file name)`);
      continue;
    }
    if (file.size > MAX_FILE_BYTES) {
      skipped.push(`${file.name} (larger than ${MAX_FILE_BYTES / 1e6} MB)`);
      continue;
    }
    const buf = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(path.join(NASA_RAW_DIR, name), buf);
    saved.push(name);
  }

  if (saved.length === 0) {
    return NextResponse.json(
      { ok: false, error: "No valid .tbl files were saved.", skipped },
      { status: 400 },
    );
  }

  try {
    await runPython(NASA_BUILD_SCRIPT, [], NASA_DIR, job);
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        log: job.log,
        saved,
        skipped,
      },
      { status: 500 },
    );
  }

  const dataset = buildNasa();
  return NextResponse.json({
    ok: true,
    log: job.log,
    saved,
    skipped,
    dataset,
  });
}
