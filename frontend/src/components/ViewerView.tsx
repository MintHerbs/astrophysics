"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import type { SourceData, Spectrum } from "@/lib/types";
import type { SourceContent } from "@/lib/content";
import { fmtInt, fmtMeta, fmtRange } from "@/lib/format";
import Icon from "./Icon";
import EmptyState from "./EmptyState";
import ChartBoundary from "./ChartBoundary";

const SpectrumChart = dynamic(() => import("./SpectrumChart"), {
  ssr: false,
  loading: () => (
    <div className="chart-shell" style={{ display: "grid", placeItems: "center", minHeight: 440 }}>
      <div style={{ textAlign: "center" }}>
        <div className="spinner" />
        <p className="type-label muted" style={{ marginTop: 12 }}>
          Loading chart
        </p>
      </div>
    </div>
  ),
});

interface Props {
  dataset: SourceData;
  content: SourceContent;
  selectedId: string;
  onSelect: (id: string) => void;
}

function optionText(s: Spectrum): string {
  if (s.label.startsWith(s.group)) {
    const rest = s.label.slice(s.group.length).replace(/^\s*-\s*/, "").trim();
    return rest || s.label;
  }
  return s.label;
}

export default function ViewerView({ dataset, content, selectedId, onSelect }: Props) {
  const groups = useMemo(() => {
    const map = new Map<string, Spectrum[]>();
    for (const s of dataset.spectra) {
      if (!map.has(s.group)) map.set(s.group, []);
      map.get(s.group)!.push(s);
    }
    return [...map.entries()];
  }, [dataset]);

  const selected = dataset.spectra.find((s) => s.id === selectedId) ?? dataset.spectra[0];

  // The whole source has nothing catalogued at all.
  if (!dataset.present || dataset.spectra.length === 0) {
    return (
      <div className="stack">
        <MeasurementBanner content={content} />
        <EmptyState
          icon="cloud_download"
          headline={content.emptyState.headline}
          body={content.emptyState.body}
          steps={content.emptyState.steps}
        />
      </div>
    );
  }

  const isTransmission = content.measurement.isTransmission;

  return (
    <div className="stack">
      <MeasurementBanner content={content} />

      <div className="field">
        <label htmlFor="spectrum-select">
          Spectrum ({dataset.spectra.length} in {content.name})
        </label>
        <div className="select">
          <select
            id="spectrum-select"
            value={selected?.id ?? ""}
            onChange={(e) => onSelect(e.target.value)}
          >
            {groups.map(([group, specs]) => (
              <optgroup key={group} label={group}>
                {specs.map((s) => (
                  <option key={s.id} value={s.id}>
                    {optionText(s)}
                    {s.pointCount > 0 ? "" : " (no points loaded)"}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <Icon name="expand_more" />
        </div>
      </div>

      {selected && selected.pointCount > 0 ? (
        <ChartBoundary>
          <SpectrumChart
            spectrum={selected}
            isTransmission={isTransmission}
            quantity={content.measurement.quantity}
            axisLabel={content.measurement.axisLabel}
          />
        </ChartBoundary>
      ) : (
        <EmptyState
          icon="download"
          headline="This spectrum has no plottable points yet"
          body={content.emptyState.body}
          steps={content.emptyState.steps}
        />
      )}

      {selected ? <ReferenceCard spectrum={selected} content={content} /> : null}
    </div>
  );
}

function MeasurementBanner({ content }: { content: SourceContent }) {
  return (
    <div className="stack">
      <div className="row">
        <span className={`chip ${content.measurement.isTransmission ? "transmission" : "demo"}`}>
          <Icon name={content.measurement.isTransmission ? "verified" : "science"} />
          {content.badge}
        </span>
        <span className="chip">
          <Icon name="straighten" />
          Y axis: {content.measurement.axisLabel}
        </span>
      </div>
      <div className="banner info">
        <Icon name="info" />
        <p>{content.measurement.caption}</p>
      </div>
      {content.caution ? (
        <div className="banner caution">
          <Icon name="warning" />
          <p>
            <strong>Not a science result. </strong>
            {content.caution}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function ReferenceCard({ spectrum, content }: { spectrum: Spectrum; content: SourceContent }) {
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">Reference and source</h3>
          <p className="type-body muted" style={{ margin: 0 }}>
            {spectrum.group}
          </p>
        </div>
        <span className="chip">
          <Icon name="source" />
          {content.name}
        </span>
      </div>
      <hr className="divider" style={{ margin: "14px 0" }} />
      <dl className="kv">
        {spectrum.reference_bibcode ? (
          <>
            <dt>Reference</dt>
            <dd>
              {spectrum.reference_url ? (
                <a href={spectrum.reference_url} target="_blank" rel="noreferrer">
                  {spectrum.reference_bibcode}
                </a>
              ) : (
                spectrum.reference_bibcode
              )}
              {spectrum.authors ? ` (${spectrum.authors})` : ""}
            </dd>
          </>
        ) : null}
        {spectrum.note ? (
          <>
            <dt>Note</dt>
            <dd>{spectrum.note}</dd>
          </>
        ) : null}
        <dt>Wavelength coverage</dt>
        <dd>{fmtRange(spectrum.wavelength_min_um, spectrum.wavelength_max_um)}</dd>
        <dt>Points loaded</dt>
        <dd>
          {fmtInt(spectrum.pointCount)}
          {spectrum.publishedPointCount && !content.measurement.isTransmission
            ? ""
            : spectrum.publishedPointCount
              ? ` (${fmtInt(spectrum.publishedPointCount)} published)`
              : ""}
        </dd>
        {spectrum.meta.map((m) => (
          <div key={m.label} style={{ display: "contents" }}>
            <dt>{m.label}</dt>
            <dd>{fmtMeta(m.value)}</dd>
          </div>
        ))}
        {spectrum.reference_url && !spectrum.reference_bibcode ? (
          <>
            <dt>Product URL</dt>
            <dd>
              <a href={spectrum.reference_url} target="_blank" rel="noreferrer">
                Download from MAST
              </a>
            </dd>
          </>
        ) : null}
      </dl>
    </div>
  );
}
