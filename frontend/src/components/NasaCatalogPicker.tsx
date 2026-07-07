"use client";

import { useMemo, useState } from "react";
import type { Spectrum } from "@/lib/types";
import { fmtInt, fmtRange } from "@/lib/format";
import Icon from "./Icon";

interface Props {
  spectra: Spectrum[];
  defaultOpen: boolean;
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

export default function NasaCatalogPicker({ spectra, defaultOpen }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return spectra
      .filter((s) => !q || s.group.toLowerCase().includes(q) || (s.note ?? "").toLowerCase().includes(q))
      .sort((a, b) => a.group.localeCompare(b.group) || (a.note ?? "").localeCompare(b.note ?? ""));
  }, [spectra, search]);

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
          <p className="type-body muted" style={{ margin: 0 }}>
            Search the catalogued spectra below, then use &quot;Open in archive&quot; to jump straight
            to that planet&apos;s page on the NASA Exoplanet Archive, pre-filtered to its atmospheric
            spectra. From there, check the row(s) you want and use &quot;Download All Checked
            Spectra&quot; (IPAC Table Format, .tbl), then drop the file(s) into the panel below.
          </p>

          <div className="row catalog-controls">
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
            <span className="type-label muted">{rows.length} catalogued spectra</span>
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
                {rows.map((s) => (
                  <tr key={s.id}>
                    <td>{s.group}</td>
                    <td className="muted">{s.note || "-"}</td>
                    <td>{fmtRange(s.wavelength_min_um, s.wavelength_max_um)}</td>
                    <td>{fmtInt(s.pointCount)}</td>
                    <td>
                      {s.reference_bibcode ? (
                        <a href={s.reference_url ?? undefined} target="_blank" rel="noreferrer">
                          {s.reference_bibcode}
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>
                      {s.pointCount > 0 ? (
                        <span className="chip transmission">
                          <Icon name="check_circle" />
                          Downloaded
                        </span>
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
                        >
                          <Icon name="open_in_new" />
                          Open in archive
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
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
