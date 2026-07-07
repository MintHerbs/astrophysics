"use client";

import type { SourceData } from "@/lib/types";
import type { SourceContent } from "@/lib/content";
import { fmtInt, fmtRange } from "@/lib/format";
import Icon from "./Icon";
import EmptyState from "./EmptyState";
import RawDataGrid from "./RawDataGrid";

interface Props {
  dataset: SourceData;
  content: SourceContent;
}

export default function OverviewView({ dataset, content }: Props) {
  if (!dataset.present || dataset.spectra.length === 0) {
    return (
      <EmptyState
        icon="inventory_2"
        headline={content.emptyState.headline}
        body={content.emptyState.body}
        steps={content.emptyState.steps}
      />
    );
  }

  const groupNoun = content.key === "nasa" ? "Planets" : "Targets";
  const spectrumNoun = content.key === "nasa" ? "Catalogued spectra" : "Observations";

  const stats = [
    { label: spectrumNoun, value: fmtInt(dataset.counts.spectra) },
    { label: groupNoun, value: fmtInt(dataset.counts.groups) },
    {
      label: content.key === "nasa" ? "Points loaded" : "Spectral points",
      value: fmtInt(dataset.counts.points),
    },
    {
      label: content.key === "nasa" ? "Published points" : "Integrations note",
      value:
        content.key === "nasa"
          ? fmtInt(dataset.counts.publishedPoints)
          : fmtInt(dataset.counts.points),
    },
  ];

  return (
    <div className="stack">
      <div className="stat-grid">
        {stats.map((s) => (
          <div className="stat" key={s.label}>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {content.key === "nasa" && !dataset.plottable ? (
        <div className="banner info">
          <Icon name="info" />
          <p>
            The catalogue below is complete and committed. The numeric data points are a
            separate manual download; the Spectrograph tab explains exactly what to run.
          </p>
        </div>
      ) : null}

      <div className="card">
        <h3 className="card-title" style={{ marginBottom: 12 }}>
          {groupNoun} in {content.name}
        </h3>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>{content.key === "nasa" ? "Planet" : "Target"}</th>
                <th>{content.key === "nasa" ? "Spectra" : "Observations"}</th>
                <th>Wavelength coverage</th>
                <th>Points</th>
                <th>References</th>
              </tr>
            </thead>
            <tbody>
              {dataset.groups.map((g) => (
                <tr key={g.name}>
                  <td>{g.name}</td>
                  <td>{fmtInt(g.spectrumCount)}</td>
                  <td>{fmtRange(g.wavelength_min_um, g.wavelength_max_um)}</td>
                  <td>
                    {fmtInt(g.points)}
                    {content.key === "nasa" && g.publishedPoints
                      ? ` / ${fmtInt(g.publishedPoints)} pub.`
                      : ""}
                  </td>
                  <td>
                    {g.references.length > 0
                      ? g.references.map((r, i) => (
                          <span key={r}>
                            {i > 0 ? ", " : ""}
                            <code>{r}</code>
                          </span>
                        ))
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <RawDataGrid source={content.key as "nasa" | "mast"} />
    </div>
  );
}
