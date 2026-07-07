"use client";

import { useEffect, useMemo, useState } from "react";
import { pollJob, type JobState } from "@/lib/useDataset";
import { fmtInt, fmtRange } from "@/lib/format";
import Icon from "./Icon";

interface CatalogTarget {
  target_name: string;
  classification: string | null;
  is_background_or_calibration: boolean;
  is_exoplanet: boolean;
  observation_count: number;
  wavelength_min_um: number | null;
  wavelength_max_um: number | null;
  exposure_time_s: number;
  proposal_ids: string[];
  already_downloaded: boolean;
}

interface CatalogResponse {
  targets: CatalogTarget[];
  exoplanetCount: number;
  totalCount: number;
}

interface DryRun {
  status: "checking" | "done" | "error";
  totalGb: number | null;
  fileCount: number | null;
  error?: string;
}

interface Props {
  defaultOpen: boolean;
  onDone: () => void;
}

export default function MastCatalogPicker({ defaultOpen, onDone }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  // Off by default: MAST's own target_classification is not a reliable "is a
  // transiting exoplanet host" flag (for example WASP-107 is classified only
  // as "Star; K dwarfs; K stars" in this inventory), so hiding rows by it as a
  // default would hide real, relevant targets. It is offered as an optional
  // narrowing filter, not a default.
  const [exoplanetOnly, setExoplanetOnly] = useState(false);
  const [dryRuns, setDryRuns] = useState<Record<string, DryRun>>({});
  const [activeJob, setActiveJob] = useState<{ target: string; job: JobState } | null>(null);

  const loadCatalog = async () => {
    setLoadError(null);
    try {
      const res = await fetch("/api/mast/catalog", { cache: "no-store" });
      if (!res.ok) throw new Error(`Request failed (${res.status}).`);
      setCatalog((await res.json()) as CatalogResponse);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : String(err));
    }
  };

  useEffect(() => {
    if (open && !catalog) loadCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const rows = useMemo(() => {
    if (!catalog) return [];
    const q = search.trim().toLowerCase();
    return catalog.targets
      .filter((t) => !exoplanetOnly || t.is_exoplanet)
      .filter((t) => !q || t.target_name.toLowerCase().includes(q));
  }, [catalog, search, exoplanetOnly]);

  const checkSize = async (target: string) => {
    setDryRuns((prev) => ({ ...prev, [target]: { status: "checking", totalGb: null, fileCount: null } }));
    try {
      const res = await fetch("/api/mast/dry-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target }),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) {
        setDryRuns((prev) => ({
          ...prev,
          [target]: { status: "error", totalGb: null, fileCount: null, error: body.error || "Size check failed." },
        }));
        return;
      }
      setDryRuns((prev) => ({
        ...prev,
        [target]: { status: "done", totalGb: body.totalGb, fileCount: body.fileCount },
      }));
    } catch (err) {
      setDryRuns((prev) => ({
        ...prev,
        [target]: {
          status: "error",
          totalGb: null,
          fileCount: null,
          error: err instanceof Error ? err.message : String(err),
        },
      }));
    }
  };

  const startDownload = async (target: string) => {
    try {
      const res = await fetch("/api/mast/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target }),
      });
      const body = await res.json();
      if (!res.ok) {
        setActiveJob({
          target,
          job: { id: "", status: "error", log: [], result: null, error: body.error || "Could not start download." },
        });
        return;
      }
      setActiveJob({ target, job: { id: body.jobId, status: "running", log: [], result: null, error: null } });
      pollJob(body.jobId, (job) => {
        setActiveJob({ target, job });
        if (job.status === "done") {
          onDone();
          loadCatalog();
        }
      });
    } catch (err) {
      setActiveJob({
        target,
        job: {
          id: "",
          status: "error",
          log: [],
          result: null,
          error: err instanceof Error ? err.message : String(err),
        },
      });
    }
  };

  const jobRunning = activeJob?.job.status === "running";

  return (
    <div className="card">
      <button
        type="button"
        className="disclosure-header"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="row" style={{ gap: 10 }}>
          <Icon name="travel_explore" />
          <span className="type-title" style={{ margin: 0 }}>
            Browse MAST observations
          </span>
        </span>
        <Icon name={open ? "expand_less" : "expand_more"} />
      </button>

      {open ? (
        <div className="stack" style={{ marginTop: 16 }}>
          {loadError ? (
            <div className="banner caution">
              <Icon name="error" />
              <p>{loadError}</p>
            </div>
          ) : !catalog ? (
            <div style={{ textAlign: "center", padding: 24 }}>
              <div className="spinner" />
            </div>
          ) : (
            <>
              <div className="row catalog-controls">
                <div className="select" style={{ flex: "1 1 260px" }}>
                  <input
                    type="search"
                    placeholder="Search target name"
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
                <label className="row" style={{ gap: 6, fontSize: "0.85rem" }} title="Based on MAST's own target_classification field, which is not always populated for known exoplanet hosts">
                  <input
                    type="checkbox"
                    checked={exoplanetOnly}
                    onChange={(e) => setExoplanetOnly(e.target.checked)}
                  />
                  MAST-classified exoplanet targets only
                </label>
                <span className="type-label muted">
                  {catalog.exoplanetCount} of {catalog.totalCount} targets carry that classification;
                  search by name to find others (for example WASP-107)
                </span>
              </div>

              <div className="table-wrap" style={{ maxHeight: 420, overflowY: "auto" }}>
                <table className="data">
                  <thead>
                    <tr>
                      <th>Target</th>
                      <th>Classification</th>
                      <th>Obs.</th>
                      <th>Wavelength</th>
                      <th>Exposure (s)</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((t) => {
                      const dr = dryRuns[t.target_name];
                      return (
                        <tr key={t.target_name}>
                          <td>{t.target_name}</td>
                          <td className="muted">{t.classification ?? "-"}</td>
                          <td>{fmtInt(t.observation_count)}</td>
                          <td>{fmtRange(t.wavelength_min_um, t.wavelength_max_um)}</td>
                          <td>{fmtInt(t.exposure_time_s)}</td>
                          <td>
                            {t.already_downloaded ? (
                              <span className="chip transmission">
                                <Icon name="check_circle" />
                                Downloaded
                              </span>
                            ) : !dr ? (
                              <button
                                type="button"
                                className="segmented-btn"
                                style={{ border: "1px solid var(--md-sys-color-outline)", borderRadius: "var(--md-shape-full)" }}
                                onClick={() => checkSize(t.target_name)}
                                disabled={jobRunning}
                              >
                                Check size
                              </button>
                            ) : dr.status === "checking" ? (
                              <span className="row" style={{ gap: 6 }}>
                                <Icon name="progress_activity" className="spin-icon" />
                                Checking
                              </span>
                            ) : dr.status === "error" ? (
                              <span className="muted" title={dr.error}>
                                Size check failed
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="segmented-btn filled"
                                onClick={() => startDownload(t.target_name)}
                                disabled={jobRunning}
                              >
                                <Icon name="download" />
                                Download {dr.totalGb !== null ? `(${dr.totalGb.toFixed(2)} GB)` : ""}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="muted" style={{ textAlign: "center" }}>
                          No observations match this search.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>

              {activeJob ? (
                <div className={`banner ${activeJob.job.status === "error" ? "caution" : "info"}`} role="status">
                  <Icon
                    name={
                      activeJob.job.status === "running"
                        ? "progress_activity"
                        : activeJob.job.status === "done"
                          ? "check_circle"
                          : "error"
                    }
                    className={activeJob.job.status === "running" ? "spin-icon" : undefined}
                  />
                  <div style={{ flex: 1 }}>
                    <p>
                      <strong>{activeJob.target}: </strong>
                      {activeJob.job.status === "running"
                        ? "downloading and building the median spectrum..."
                        : activeJob.job.status === "done"
                          ? "done. The spectrograph now has this observation."
                          : activeJob.job.error || "The download failed."}
                    </p>
                    {activeJob.job.log.length > 0 ? (
                      <code className="code" style={{ marginTop: 6, maxHeight: 160, overflowY: "auto" }}>
                        {activeJob.job.log.slice(-40).join("\n")}
                      </code>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
