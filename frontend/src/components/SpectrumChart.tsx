"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  ComposedChart,
  ErrorBar,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Spectrum } from "@/lib/types";
import { SCIENCE_BANDS } from "@/lib/science";
import { fmtNumber } from "@/lib/format";
import Icon from "./Icon";

interface Props {
  spectrum: Spectrum;
  isTransmission: boolean;
  quantity: string;
  axisLabel: string;
}

/** How the series is drawn. Points is the default for measured spectra. */
type ChartType = "points" | "line" | "smooth";

const CHART_TYPE_OPTIONS: Array<{ value: ChartType; label: string; icon: string }> = [
  { value: "points", label: "Points", icon: "scatter_plot" },
  { value: "line", label: "Line", icon: "show_chart" },
  { value: "smooth", label: "Smooth", icon: "timeline" },
];

/** Above this many points, markers on a line are dropped to keep it readable. */
const DOT_LIMIT = 300;

interface Datum {
  x: number;
  y: number;
  errY: number | null;
}

function formatY(v: number): string {
  const a = Math.abs(v);
  if (a === 0) return "0";
  if (a >= 1000 || a < 0.001) return v.toExponential(2);
  if (a >= 1) return v.toFixed(2);
  return v.toPrecision(3);
}

const SERIES_COLOR = "var(--md-sys-color-primary)";
const WINDOW_COLOR = "var(--md-sys-color-tertiary)";
const OZONE_COLOR = "var(--md-sys-color-error)";

export default function SpectrumChart({ spectrum, isTransmission, quantity, axisLabel }: Props) {
  // Default to points for measured transmission spectra (error bars matter),
  // and to a smooth line for the MAST flux demo, matching the prior behaviour.
  const [chartType, setChartType] = useState<ChartType>(isTransmission ? "points" : "smooth");
  const [showErrorBars, setShowErrorBars] = useState(true);

  const data: Datum[] = useMemo(
    () =>
      spectrum.points.map((p) => {
        const err =
          p.errLow !== null && p.errHigh !== null
            ? (p.errLow + p.errHigh) / 2
            : (p.errLow ?? p.errHigh ?? null);
        return { x: p.x, y: p.y, errY: err };
      }),
    [spectrum],
  );

  const { xDomain, yDomain } = useMemo(() => {
    if (data.length === 0) {
      return { xDomain: [0, 1] as [number, number], yDomain: [0, 1] as [number, number] };
    }
    const xs = data.map((d) => d.x);
    let yLo = Infinity;
    let yHi = -Infinity;
    for (const d of data) {
      const e = d.errY ?? 0;
      yLo = Math.min(yLo, d.y - e);
      yHi = Math.max(yHi, d.y + e);
    }
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const xPad = (xMax - xMin) * 0.03 || 0.1;
    const yPad = (yHi - yLo) * 0.08 || Math.abs(yHi) * 0.1 || 1;
    return {
      xDomain: [xMin - xPad, xMax + xPad] as [number, number],
      yDomain: [yLo - yPad, yHi + yPad] as [number, number],
    };
  }, [data]);

  const windowBand = SCIENCE_BANDS.find((b) => b.kind === "window");
  const ozone = SCIENCE_BANDS.find((b) => b.kind === "line");

  const showWindow =
    !!windowBand &&
    windowBand.kind === "window" &&
    windowBand.max_um > xDomain[0] &&
    windowBand.min_um < xDomain[1];
  const winX1 =
    showWindow && windowBand.kind === "window" ? Math.max(windowBand.min_um, xDomain[0]) : 0;
  const winX2 =
    showWindow && windowBand.kind === "window" ? Math.min(windowBand.max_um, xDomain[1]) : 0;
  const showOzone =
    !!ozone && ozone.kind === "line" && ozone.center_um > xDomain[0] && ozone.center_um < xDomain[1];

  const errorBarsOn = showErrorBars && spectrum.hasErrors;
  const showDots = data.length <= DOT_LIMIT;
  const lineType = chartType === "smooth" ? "monotone" : "linear";

  return (
    <div>
      <div
        className="row"
        style={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 12 }}
      >
        <label
          className="type-label"
          style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: spectrum.hasErrors ? "pointer" : "not-allowed", opacity: spectrum.hasErrors ? 1 : 0.5 }}
        >
          <input
            type="checkbox"
            checked={errorBarsOn}
            disabled={!spectrum.hasErrors}
            onChange={(e) => setShowErrorBars(e.target.checked)}
          />
          Error bars
        </label>
        <div className="segmented" role="group" aria-label="Chart type">
          {CHART_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className="segmented-btn"
              aria-pressed={chartType === opt.value}
              onClick={() => setChartType(opt.value)}
            >
              <Icon name={opt.icon} />
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="chart-shell">
        <ResponsiveContainer width="100%" height={440}>
          <ComposedChart data={data} margin={{ top: 16, right: 24, bottom: 40, left: 24 }}>
            <CartesianGrid stroke="var(--md-sys-color-outline-variant)" strokeOpacity={0.5} />
            {showWindow ? (
              <ReferenceArea
                x1={winX1}
                x2={winX2}
                fill={WINDOW_COLOR}
                fillOpacity={0.16}
                stroke={WINDOW_COLOR}
                strokeOpacity={0.35}
                ifOverflow="hidden"
              />
            ) : null}
            {showOzone ? (
              <ReferenceLine
                x={ozone!.kind === "line" ? ozone!.center_um : undefined}
                stroke={OZONE_COLOR}
                strokeDasharray="5 4"
                strokeOpacity={0.8}
                ifOverflow="hidden"
                label={{
                  value: "O3 9.6 um",
                  position: "insideTopRight",
                  fill: "var(--md-sys-color-error)",
                  fontSize: 11,
                }}
              />
            ) : null}
            <XAxis
              type="number"
              dataKey="x"
              domain={xDomain}
              allowDecimals
              tick={{ fill: "var(--md-sys-color-on-surface-variant)", fontSize: 12 }}
              tickFormatter={(v: number) => fmtNumber(v, 1)}
              stroke="var(--md-sys-color-outline)"
              label={{
                value: "Wavelength (micrometres)",
                position: "insideBottom",
                offset: -20,
                fill: "var(--md-sys-color-on-surface)",
                fontSize: 13,
              }}
            />
            <YAxis
              type="number"
              domain={yDomain}
              tick={{ fill: "var(--md-sys-color-on-surface-variant)", fontSize: 12 }}
              tickFormatter={formatY}
              stroke="var(--md-sys-color-outline)"
              width={72}
              label={{
                value: axisLabel,
                angle: -90,
                position: "insideLeft",
                style: { textAnchor: "middle", fill: "var(--md-sys-color-on-surface)", fontSize: 13 },
              }}
            />
            <Tooltip
              content={<SpectrumTooltip quantity={quantity} />}
              cursor={{ stroke: "var(--md-sys-color-outline)", strokeDasharray: "4 4" }}
            />
            {chartType === "points" ? (
              <Scatter
                data={data}
                dataKey="y"
                fill={SERIES_COLOR}
                line={false}
                isAnimationActive={false}
              >
                {errorBarsOn ? (
                  <ErrorBar
                    dataKey="errY"
                    direction="y"
                    width={4}
                    strokeWidth={1.4}
                    stroke={SERIES_COLOR}
                  />
                ) : null}
              </Scatter>
            ) : (
              <Line
                type={lineType}
                dataKey="y"
                stroke={SERIES_COLOR}
                strokeWidth={2}
                dot={showDots ? { r: 2, fill: SERIES_COLOR, stroke: SERIES_COLOR } : false}
                isAnimationActive={false}
              >
                {errorBarsOn ? (
                  <ErrorBar
                    dataKey="errY"
                    direction="y"
                    width={4}
                    strokeWidth={1.2}
                    stroke={SERIES_COLOR}
                  />
                ) : null}
              </Line>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-legend" aria-hidden="true">
        <span className="legend-item">
          <span
            className={`legend-swatch${chartType === "points" ? "" : " line"}`}
            style={{ backgroundColor: SERIES_COLOR }}
          />
          {quantity}
          {errorBarsOn ? " (with 1-sigma error bars)" : ""}
        </span>
        {showWindow ? (
          <span className="legend-item">
            <span
              className="legend-swatch"
              style={{ backgroundColor: WINDOW_COLOR, opacity: 0.4 }}
            />
            Technosignature target window (8.6 to 11.8 um)
          </span>
        ) : null}
        {showOzone ? (
          <span className="legend-item">
            <span
              className="legend-swatch line"
              style={{ backgroundColor: OZONE_COLOR }}
            />
            Ozone feature (near 9.6 um)
          </span>
        ) : null}
      </div>
    </div>
  );
}

interface TooltipProps {
  quantity: string;
  active?: boolean;
  payload?: Array<{ payload: Datum }>;
}

function SpectrumTooltip({ quantity, active, payload }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <div>
        <span className="tt-key">Wavelength: </span>
        {fmtNumber(d.x, 4)} um
      </div>
      <div>
        <span className="tt-key">{quantity}: </span>
        {formatY(d.y)}
        {d.errY !== null ? ` +/- ${formatY(d.errY)}` : ""}
      </div>
    </div>
  );
}
