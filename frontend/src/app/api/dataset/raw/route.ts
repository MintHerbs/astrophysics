import { NextRequest, NextResponse } from "next/server";
import { readCsv } from "@/lib/server/csv";
import { NASA_SPECTRA_CSV, MAST_INVENTORY_CSV } from "@/lib/server/paths";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const source = searchParams.get("source");

  let filePath = "";
  if (source === "nasa") {
    // The same catalogue the viewer reads (buildNasa), so every NASA view is
    // consistent. This is a raw read of the archive-export CSV as-is.
    filePath = NASA_SPECTRA_CSV;
  } else if (source === "mast") {
    filePath = MAST_INVENTORY_CSV;
  } else {
    return NextResponse.json({ error: "Invalid source parameter" }, { status: 400 });
  }

  try {
    const table = readCsv(filePath);
    if (!table) {
      return NextResponse.json(
        { error: "Dataset file not found", rows: [], headers: [] },
        { status: 404 }
      );
    }

    return NextResponse.json({ rows: table.records, headers: table.header });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to read CSV data" },
      { status: 500 }
    );
  }
}
