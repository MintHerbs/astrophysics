"use client";

import { useMemo, useState } from "react";
import type { Spectrum } from "@/lib/types";
import { fmtInt, fmtRange } from "@/lib/format";
import {
  POINTS_FILTER_OPTIONS,
  matchesPointsFilter,
  type PointsFilter,
} from "@/lib/pointsFilter";
import Icon from "./Icon";

interface Props {
  spectra: Spectrum[];
  defaultOpen: boolean;
  selectedId?: string;
  onSelect?: (id: string) => void;
  /** Ids whose points have been fetched on demand this session. */
  loadedIds?: ReadonlySet<string>;
  /** Id currently being fetched, if any. */
  loadingId?: string | null;
  /** Per-id fetch error messages. */
  errorById?: Record<string, string>;
  /** Fetch a catalogued spectrum's points from the archive on demand. */
  onLoad?: (id: string) => void;
}

/**
 * Deep link into the NASA Exoplanet Archive's Atmospheric Spectroscopy tool,
 * pre-filtered to one planet. This exact URL pattern
 * (?atmospheres&planet='<name>') is not documented publicly, but it is the
 * real link the archive's own per-planet Overview page uses to reach that
 * planet's spectra (found on
 * https://exoplanetarchive.ipac.caltech.edu/overview/<host-star-name>), so it
 * is reused rather than invented. If the archive ever changes this, the
 * generic search page below still works as a fallback.
 */
function planetArchiveUrl(planet: string): string {
  const encoded = planet.trim().replace(/\s+/g, "+");
  return `https://exoplanetarchive.ipac.caltech.edu/cgi-bin/atmospheres/nph-firefly?atmospheres&planet='${encoded}'`;
}

export default function NasaCatalogPicker({
  spectra,
  defaultOpen,
  selectedId,
  onSelect,
  loadedIds,
  loadingId,
  errorById,
  onLoad,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<PointsFilter>("all");

  const hasAnyPoints = (s: Spectrum) => s.pointCount > 0 || (loadedIds?.has(s.id) ?? false);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return spectra
      .filter((s) => matchesPointsFilter(s, filter, loadedIds))
      .filter((s) => !q || s.group.toLowerCase().includes(q) || (s.note ?? "").toLowerCase().includes(q))
      .sort((a, b) => a.group.localeCompare(b.group) || (a.note ?? "").localeCompare(b.note ?? ""));
  }, [spectra, search, filter, loadedIds]);

  return (
    <div className="card">
      <button type="button" className="disclosure-header" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="row" style={{ gap: 10 }}>
          <Icon name="travel_explore" />
          <span className="type-title" style={{ margin: 0 }}>
            Find a spectrum in the archive
          </span>
        </span>
        <Icon name={open ? "expand_less" : "expand_more"} />
      </button>

      {open ? (
        <div className="stack" style={{ marginTop: 16 }}>
          <div className="row catalog-controls" style={{ flexWrap: "wrap", gap: 12 }}>
            <div className="select" style={{ flex: "1 1 260px" }}>
              <input
                type="search"
                placeholder="Search planet or pipeline note"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "var(--md-shape-xs)",
                  border: "1px solid var(--md-sys-color-outline)",
                  backgroundColor: "var(--md-sys-color-surface-container-highest)",
                  color: "var(--md-sys-color-on-surface)",
                  fontFamily: "inherit",
                  fontSize: "0.95rem",
                }}
              />
            </div>
            <div className="segmented" role="group" aria-label="Filter by points availability">
              {POINTS_FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className="segmented-btn"
                  aria-pressed={filter === opt.value}
                  onClick={() => setFilter(opt.value)}
                >
                  <Icon name={opt.icon} />
                  {opt.label}
                </button>
              ))}
            </div>
            <span className="type-label muted">{rows.length} spectra</span>
          </div>

          <div className="table-wrap" style={{ maxHeight: 420, overflowY: "auto" }}>
            <table className="data">
              <thead>
                <tr>
                  <th>Planet</th>
                  <th>Pipeline / note</th>
                  <th>Wavelength</th>
                  <th>Points</th>
                  <th>Reference</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => {
                  const isSelected = s.id === selectedId;
                  const pointsHere = hasAnyPoints(s);
                  const isPlottable = pointsHere && !!onSelect;
                  const isLoading = loadingId === s.id;
                  const rowError = errorById?.[s.id];
                  return (
                    <tr
                      key={s.id}
                      aria-selected={isSelected}
                      onClick={isPlottable ? () => onSelect!(s.id) : undefined}
                      style={{
                        cursor: isPlottable ? "pointer" : undefined,
                        backgroundColor: isSelected ? "var(--md-sys-color-surface-container-highest)" : undefined,
                      }}
                    >
                      <td>{s.group}</td>
                      <td className="muted">{s.note || "-"}</td>
                      <td>{fmtRange(s.wavelength_min_um, s.wavelength_max_um)}</td>
                      <td>
                        {pointsHere ? (
                          fmtInt(s.pointCount > 0 ? s.pointCount : (s.publishedPointCount ?? 0))
                        ) : (
                          <span className="muted">
                            {s.publishedPointCount ? `${fmtInt(s.publishedPointCount)} in archive` : "-"}
                          </span>
                        )}
                      </td>
                      <td>
                        {s.reference_bibcode ? (
                          <a
                            href={s.reference_url ?? undefined}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {s.reference_bibcode}
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>
                        {pointsHere ? (
                          <button
                            type="button"
                            className="segmented-btn"
                            style={{
                              border: "1px solid var(--md-sys-color-outline)",
                              borderRadius: "var(--md-shape-full)",
                            }}
                            aria-pressed={isSelected}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelect?.(s.id);
                            }}
                          >
                            <Icon name={isSelected ? "check_circle" : "show_chart"} />
                            {isSelected ? "Plotted" : "Plot"}
                          </button>
                        ) : onLoad ? (
                          <button
                            type="button"
                            className="segmented-btn"
                            style={{
                              border: "1px solid var(--md-sys-color-outline)",
                              borderRadius: "var(--md-shape-full)",
                            }}
                            disabled={isLoading}
                            title={rowError || undefined}
                            onClick={(e) => {
                              e.stopPropagation();
                              onLoad(s.id);
                            }}
                          >
                            {isLoading ? (
                              <span className="spinner" style={{ width: 16, height: 16 }} />
                            ) : (
                              <Icon name={rowError ? "error" : "download"} />
                            )}
                            {isLoading ? "Loading" : rowError ? "Retry" : "Load points"}
                          </button>
                        ) : (
                          <a
                            className="segmented-btn"
                            style={{
                              border: "1px solid var(--md-sys-color-outline)",
                              borderRadius: "var(--md-shape-full)",
                            }}
                            href={planetArchiveUrl(s.group)}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Icon name="open_in_new" />
                            Open in archive
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="muted" style={{ textAlign: "center" }}>
                      No catalogued spectra match this search.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
