import { NextResponse } from "next/server";
import { buildNasa, buildMast } from "@/lib/server/buildDataset";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, context: { params: Promise<{ source: string }> }) {
  const { source } = await context.params;
  if (source === "nasa") return NextResponse.json(buildNasa());
  if (source === "mast") return NextResponse.json(buildMast());
  return NextResponse.json({ error: "Unknown source." }, { status: 404 });
}
