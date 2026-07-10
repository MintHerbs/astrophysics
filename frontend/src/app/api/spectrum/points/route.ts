import { NextResponse } from "next/server";
import { fetchNasaSpectrumPoints } from "@/lib/server/nasaArchive";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * On-demand fetch of one catalogued spectrum's points from the live archive,
 * for the "no points loaded" case in the viewer. NASA only: MAST points come
 * from locally generated median CSVs, not a per-spectrum archive file.
 *
 *   GET /api/spectrum/points?source=nasa&id=<basename>.tbl
 *
 * Every point in the source file is returned so the full spectrum can be
 * visualised. The id is validated against the real inventory in
 * fetchNasaSpectrumPoints; an id not in the catalogue returns 404. Nothing is
 * written to disk.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const source = searchParams.get("source");
  const id = searchParams.get("id");

  if (source !== "nasa") {
    return NextResponse.json(
      { error: "On-demand point fetch is available for the NASA source only." },
      { status: 400 },
    );
  }
  if (!id) {
    return NextResponse.json({ error: "Missing spectrum id." }, { status: 400 });
  }

  try {
    const result = await fetchNasaSpectrumPoints(id);
    return NextResponse.json({
      id,
      source,
      ...result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const notInCatalogue = message.includes("not in the catalogue");
    return NextResponse.json({ error: message }, { status: notInCatalogue ? 404 : 502 });
  }
}
