"use client";

import { useEffect, useMemo, useState } from "react";
import Icon from "./Icon";
import { NASA_HIGHLIGHTS, MAST_HIGHLIGHTS } from "@/lib/rawColumnHighlights";

interface Props {
  source: "nasa" | "mast";
}

type SortDirection = "asc" | "desc";

const PAGE_SIZES = [50, 100, 250];

function compareValues(a: string, b: string): number {
  const aEmpty = a === undefined || a === null || a === "";
  const bEmpty = b === undefined || b === null || b === "";
  if (aEmpty && bEmpty) return 0;
  if (aEmpty) return 1;
  if (bEmpty) return -1;

  const aNum = Number(a);
  const bNum = Number(b);
  if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) return aNum - bNum;
  return a.localeCompare(b);
}

function toCsv(headers: string[], rows: Record<string, string>[]): string {
  const escape = (value: unknown) => {
    const text = value === undefined || value === null ? "" : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const lines = [headers.map(escape).join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  }
  return lines.join("\n");
}

export default function CleanRawTable({ source }: Props) {
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<{ column: string; direction: SortDirection } | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(100);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setPage(0);
    setSort(null);
    fetch(`/api/dataset/raw?source=${source}`)
      .then((res) => {
        if (!res.ok) throw new Error("Network error");
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        setRows(data.rows ?? []);
        setHeaders(data.headers ?? []);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [source]);

  const studyHighlights = source === "nasa" ? NASA_HIGHLIGHTS : MAST_HIGHLIGHTS;

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const { column, direction } = sort;
    const factor = direction === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => factor * compareValues(a[column], b[column]));
  }, [rows, sort]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const pagedRows = sortedRows.slice(page * pageSize, page * pageSize + pageSize);

  const toggleSort = (column: string) => {
    setSort((prev) => {
      if (!prev || prev.column !== column) return { column, direction: "asc" };
      return { column, direction: prev.direction === "asc" ? "desc" : "asc" };
    });
  };

  const onExportClick = () => {
    const csv = toCsv(headers, sortedRows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${source}_export.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <p className="type-body muted">Loading raw dataset...</p>;
  }

  if (error) {
    return <p className="type-body muted">Could not load the raw dataset. {error}</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <p className="type-label muted" style={{ margin: 0 }}>
          {sortedRows.length} rows &middot; page {page + 1} of {totalPages}
        </p>
        <button
          type="button"
          className="segmented-btn"
          onClick={onExportClick}
          style={{ borderRadius: 8, border: "1px solid var(--md-sys-color-outline)" }}
        >
          <Icon name="download" />
          Download CSV
        </button>
      </div>

      <div className="table-wrap" style={{ maxHeight: 500, overflowY: "auto" }}>
        <table className="data">
          <thead>
            <tr>
              {headers.map((h) => {
                const isHighlighted = studyHighlights.includes(h);
                const isSorted = sort?.column === h;
                return (
                  <th
                    key={h}
                    className={isHighlighted ? "highlighted-col" : undefined}
                    onClick={() => toggleSort(h)}
                    style={{ cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      {h}
                      {isSorted ? (
                        <Icon name={sort!.direction === "asc" ? "arrow_upward" : "arrow_downward"} size={16} />
                      ) : null}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pagedRows.map((row, i) => (
              <tr key={page * pageSize + i}>
                {headers.map((h) => (
                  <td key={h} className={studyHighlights.includes(h) ? "highlighted-col" : undefined}>
                    {row[h]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Rows per page">
          {PAGE_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              className="segmented-btn"
              aria-pressed={pageSize === size}
              onClick={() => {
                setPageSize(size);
                setPage(0);
              }}
            >
              {size}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className="segmented-btn"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            style={{ borderRadius: 8, border: "1px solid var(--md-sys-color-outline)" }}
          >
            <Icon name="chevron_left" />
            Previous
          </button>
          <button
            type="button"
            className="segmented-btn"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            style={{ borderRadius: 8, border: "1px solid var(--md-sys-color-outline)" }}
          >
            Next
            <Icon name="chevron_right" />
          </button>
        </div>
      </div>
    </div>
  );
}
