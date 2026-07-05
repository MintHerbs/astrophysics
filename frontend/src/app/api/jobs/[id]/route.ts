import { NextResponse } from "next/server";
import { getJob } from "@/lib/server/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const job = getJob(id);
  if (!job) {
    return NextResponse.json({ error: "Unknown job id." }, { status: 404 });
  }
  return NextResponse.json({
    id: job.id,
    status: job.status,
    log: job.log,
    result: job.status === "done" ? job.result : null,
    error: job.error,
  });
}
