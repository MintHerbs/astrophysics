"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { SourceData, Spectrum } from "@/lib/types";
import type { SourceContent } from "@/lib/content";
import { fmtInt, fmtMeta, fmtRange } from "@/lib/format";
import { SCIENCE_BANDS } from "@/lib/science";
import {
  POINTS_FILTER_OPTIONS,
  matchesPointsFilter,
  type PointsFilter,
} from "@/lib/pointsFilter";
import { useSpectrumPoints, type LoadedPoints } from "@/lib/useSpectrumPoints";
import Icon from "./Icon";
import EmptyState from "./EmptyState";
import ChartBoundary from "./ChartBoundary";
import NasaCatalogPicker from "./NasaCatalogPicker";
import MastCatalogPicker from "./MastCatalogPicker";

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
  onDataChanged: () => void;
}

function optionText(s: Spectrum): string {
  if (s.label.startsWith(s.group)) {
    const rest = s.label.slice(s.group.length).replace(/^\s*-\s*/, "").trim();
    return rest || s.label;
  }
  return s.label;
}

/** Merge on-demand fetched points into a spectrum so the chart can render them. */
function withLoadedPoints(spectrum: Spectrum, loaded: LoadedPoints | undefined): Spectrum {
  if (spectrum.pointCount > 0 || !loaded) return spectrum;
  return {
    ...spectrum,
    points: loaded.points,
    pointCount: loaded.points.length,
    hasErrors: loaded.points.some((p) => p.errLow !== null && Number.isFinite(p.errLow)),
    yUnit: loaded.depthUnit ?? spectrum.yUnit,
    yColumn: loaded.depthColumn ?? spectrum.yColumn,
  };
}

export default function ViewerView({ dataset, content, selectedId, onSelect, onDataChanged }: Props) {
  const [filter, setFilter] = useState<PointsFilter>("all");
  const canFetch = content.key === "nasa";
  const { loaded, loadingId, errorById, load } = useSpectrumPoints(content.key);
  const loadedIds = useMemo(() => new Set(Object.keys(loaded)), [loaded]);

  const hasAnyPoints = (s: Spectrum) => s.pointCount > 0 || loadedIds.has(s.id);

  const counts = useMemo(() => {
    let withPoints = 0;
    for (const s of dataset.spectra) {
      if (s.pointCount > 0 || loadedIds.has(s.id)) withPoints += 1;
    }
    return { total: dataset.spectra.length, withPoints, without: dataset.spectra.length - withPoints };
  }, [dataset, loadedIds]);

  const groups = useMemo(() => {
    const map = new Map<string, Spectrum[]>();
    for (const s of dataset.spectra) {
      if (!map.has(s.group)) map.set(s.group, []);
      map.get(s.group)!.push(s);
    }
    return [...map.entries()];
  }, [dataset]);

  /**
   * When nothing has been explicitly selected yet, default to a spectrum that
   * actually overlaps the technosignature target window (8.6 to 11.8 um)
   * rather than just the first catalogue row, so the science-band annotation
   * is visible on first load whenever a MIRI spectrum is available.
   */
  const defaultSpectrum = useMemo(() => {
    const windowBand = SCIENCE_BANDS.find((b) => b.kind === "window");
    if (windowBand && windowBand.kind === "window") {
      const inWindow = dataset.spectra.find(
        (s) =>
          s.pointCount > 0 &&
          s.wavelength_min_um !== null &&
          s.wavelength_max_um !== null &&
          s.wavelength_max_um > windowBand.min_um &&
          s.wavelength_min_um < windowBand.max_um,
      );
      if (inWindow) return inWindow;
    }
    return dataset.spectra[0];
  }, [dataset]);

  const selected = dataset.spectra.find((s) => s.id === selectedId) ?? defaultSpectrum;

  // The selected spectrum always stays visible in the dropdown, even if the
  // active filter would otherwise hide it, so the control never goes blank.
  const filteredGroups = useMemo(() => {
    return groups
      .map(
        ([group, specs]) =>
          [
            group,
            specs.filter((s) => matchesPointsFilter(s, filter, loadedIds) || s.id === selected?.id),
          ] as [string, Spectrum[]],
      )
      .filter(([, specs]) => specs.length > 0);
  }, [groups, filter, loadedIds, selected?.id]);

  const effectiveSelected = selected ? withLoadedPoints(selected, loaded[selected.id]) : undefined;
  const selectedLoaded = selected ? loaded[selected.id] : undefined;
  const selectedError = selected ? errorById[selected.id] : undefined;
  const isTransmission = content.measurement.isTransmission;

  const populatePanel =
    content.key === "nasa" ? (
      <NasaCatalogPicker
        spectra={dataset.spectra}
        defaultOpen={!dataset.plottable}
        selectedId={selected?.id}
        onSelect={onSelect}
        loadedIds={loadedIds}
        loadingId={loadingId}
        errorById={errorById}
        onLoad={load}
      />
    ) : (
      <MastCatalogPicker defaultOpen={!dataset.plottable} onDone={onDataChanged} />
    );

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
        {populatePanel}
      </div>
    );
  }

  return (
    <div className="stack">
      <MeasurementBanner content={content} />

      <div className="field">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <label htmlFor="spectrum-select" style={{ marginBottom: 0 }}>
            Spectrum ({dataset.spectra.length} in {content.name})
          </label>
          <div className="segmented" role="group" aria-label="Filter by points availability">
            {POINTS_FILTER_OPTIONS.map((opt) => {
              const n =
                opt.value === "all"
                  ? counts.total
                  : opt.value === "loaded"
                    ? counts.withPoints
                    : counts.without;
              return (
                <button
                  key={opt.value}
                  type="button"
                  className="segmented-btn"
                  aria-pressed={filter === opt.value}
                  onClick={() => setFilter(opt.value)}
                >
                  <Icon name={opt.icon} />
                  {opt.label} ({fmtInt(n)})
                </button>
              );
            })}
          </div>
        </div>
        <div className="select" style={{ marginTop: 10 }}>
          <select
            id="spectrum-select"
            value={selected?.id ?? ""}
            onChange={(e) => onSelect(e.target.value)}
          >
            {filteredGroups.map(([group, specs]) => (
              <optgroup key={group} label={group}>
                {specs.map((s) => (
                  <option key={s.id} value={s.id}>
                    {optionText(s)}
                    {hasAnyPoints(s)
                      ? s.pointCount === 0
                        ? " (loaded from archive)"
                        : ""
                      : " (no points loaded)"}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <Icon name="expand_more" />
        </div>
      </div>

      {effectiveSelected && effectiveSelected.pointCount > 0 ? (
        <>
          {selectedLoaded ? (
            <div className="banner info">
              <Icon name="cloud_done" />
              <p>
                All {fmtInt(effectiveSelected.pointCount)}{" "}
                {effectiveSelected.pointCount === 1 ? "point" : "points"} fetched live from the NASA
                Exoplanet Archive for this session (not saved to disk).
              </p>
            </div>
          ) : null}
          <ChartBoundary>
            <SpectrumChart
              spectrum={effectiveSelected}
              isTransmission={isTransmission}
              quantity={content.measurement.quantity}
              axisLabel={
                effectiveSelected.yUnit
                  ? `${content.measurement.quantity} (${effectiveSelected.yUnit})`
                  : content.measurement.axisLabel
              }
            />
          </ChartBoundary>
        </>
      ) : (
        <NoPointsPanel
          content={content}
          canFetch={canFetch}
          loading={selected ? loadingId === selected.id : false}
          error={selectedError}
          onLoad={selected ? () => load(selected.id) : undefined}
        />
      )}

      {effectiveSelected ? <ReferenceCard spectrum={effectiveSelected} content={content} fetched={!!selectedLoaded} /> : null}

      {populatePanel}
    </div>
  );
}

/**
 * Shown when the selected spectrum has no plottable points yet. For NASA it
 * offers to fetch them from the archive on demand; otherwise it falls back to
 * the source's download instructions.
 */
function NoPointsPanel({
  content,
  canFetch,
  loading,
  error,
  onLoad,
}: {
  content: SourceContent;
  canFetch: boolean;
  loading: boolean;
  error?: string;
  onLoad?: () => void;
}) {
  if (!canFetch) {
    return (
      <EmptyState
        icon="download"
        headline="This spectrum has no plottable points yet"
        body={content.emptyState.body}
        steps={content.emptyState.steps}
      />
    );
  }
  return (
    <div className="card" style={{ display: "grid", placeItems: "center", padding: 40, textAlign: "center" }}>
      <span style={{ color: "var(--md-sys-color-primary)" }}>
        <Icon name="cloud_download" size={40} />
      </span>
      <h3 className="card-title" style={{ marginTop: 12 }}>
        This spectrum has no points loaded yet
      </h3>
      <p className="type-body muted" style={{ maxWidth: 520, margin: "6px auto 16px" }}>
        Its data file is not downloaded locally. You can pull every published point straight from the
        NASA Exoplanet Archive for this session. Nothing is saved to disk; to keep it permanently,
        download the .tbl file into data/NASA_Archive.
      </p>
      <button
        type="button"
        className="segmented-btn filled"
        style={{ borderRadius: "var(--md-shape-full)" }}
        onClick={onLoad}
        disabled={loading}
      >
        {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : <Icon name="download" />}
        {loading ? "Fetching from archive" : "Load points from archive"}
      </button>
      {error ? (
        <div className="banner caution" role="alert" style={{ marginTop: 16, textAlign: "left" }}>
          <Icon name="error" />
          <p>
            <strong>Could not load points. </strong>
            {error}
          </p>
        </div>
      ) : null}
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

function ReferenceCard({
  spectrum,
  content,
  fetched,
}: {
  spectrum: Spectrum;
  content: SourceContent;
  fetched: boolean;
}) {
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
        {spectrum.yUnit ? (
          <>
            <dt>Depth unit</dt>
            <dd>{spectrum.yUnit} (as recorded in the source file)</dd>
          </>
        ) : null}
        <dt>Points loaded</dt>
        <dd>
          {fmtInt(spectrum.pointCount)}
          {spectrum.publishedPointCount && !content.measurement.isTransmission
            ? ""
            : spectrum.publishedPointCount
              ? ` (${fmtInt(spectrum.publishedPointCount)} published)`
              : ""}
          {fetched ? " - fetched live from the archive, not saved to disk" : ""}
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
