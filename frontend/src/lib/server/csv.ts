/** Minimal RFC 4180 CSV parser/reader shared by the server-side dataset builder. */

import fs from "node:fs";

export type CsvRow = Record<string, string>;

export interface CsvTable {
  header: string[];
  records: CsvRow[];
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let record: string[] = [];
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
  if (field.length > 0 || record.length > 0) {
    pushRecord();
  }
  return rows;
}

export function readCsv(filePath: string): CsvTable | null {
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
    const obj: CsvRow = {};
    header.forEach((key, idx) => {
      obj[key] = cells[idx] !== undefined ? cells[idx] : "";
    });
    return obj;
  });
  return { header, records };
}

export const num = (v: string | undefined | null): number | null => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (s === "" || s.toLowerCase() === "nan" || s.toLowerCase() === "na") return null;
  const x = Number(s);
  return Number.isFinite(x) ? x : null;
};

export const int = (v: string | undefined | null): number | null => {
  const x = num(v);
  return x === null ? null : Math.round(x);
};

export const str = (v: string | undefined | null): string | null => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
};

export const basename = (p: string | null | undefined): string | null => {
  if (!p) return null;
  const clean = String(p).replace(/\\/g, "/");
  const parts = clean.split("/");
  return parts[parts.length - 1] || null;
};

export const minMax = (values: Array<number | null>): [number | null, number | null] => {
  const finite = values.filter((x): x is number => x !== null && Number.isFinite(x));
  if (finite.length === 0) return [null, null];
  return [Math.min(...finite), Math.max(...finite)];
};

export const uniqueOrdered = (values: Array<string | null>): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    if (v && !seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
};
