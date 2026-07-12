"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AXIS,
  SPECTRAL_REGIONS,
  TARGET_WINDOW,
  type Gas,
  type GasGroup,
  type Telescope,
} from "@/data/coverage";

/** A pinned or hovered selection: a single gas row or a single telescope bar. */
export type Selection = { kind: "gas"; id: string } | { kind: "telescope"; id: string };

interface CoverageChartProps {
  telescopes: Telescope[];
  groups: GasGroup[];
  gases: Gas[];
  active: Selection | null;
  pinned: Selection | null;
  matchedTelescopeIds: Set<string>;
  matchedGasIds: Set<string>;
  onHover: (sel: Selection | null) => void;
  onTogglePin: (sel: Selection) => void;
}

const LOG_MIN = Math.log10(AXIS.min_um);
const LOG_MAX = Math.log10(AXIS.max_um);

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Colour for a gas group. Each group is one hue from the extended Material You
 * categorical palette: industrial gases blue, biosignatures green. Colour
 * encodes group membership; the gas name identifies the individual species.
 */
export function gasColor(group: Gas["group"]): string {
  return group === "industrial" ? "var(--md-cat-blue)" : "var(--md-cat-green)";
}

/**
 * Colour for a telescope, one distinct hue per spectroscopy facility. Photometry
 * facilities have no hue: they are drawn hatched and neutral on purpose.
 */
export function telescopeColor(id: string): string {
  switch (id) {
    case "hubble":
      return "var(--md-cat-amber)";
    case "jwst-nir":
      return "var(--md-cat-cyan)";
    case "jwst-miri":
      return "var(--md-cat-magenta)";
    default:
      return "var(--md-sys-color-on-surface-variant)";
  }
}

const SHELL = "var(--md-sys-color-surface-container-lowest)";

interface GasLane {
  gas: Gas;
  top: number;
}
interface GroupBlock {
  group: GasGroup;
  headerTop: number;
  lanes: GasLane[];
}
interface TeleLane {
  telescope: Telescope;
  top: number;
}

interface Layout {
  width: number;
  height: number;
  gutter: number;
  plotLeft: number;
  plotRight: number;
  plotW: number;
  plotTop: number;
  plotBottom: number;
  regionLabelY: number;
  teleHeaderTop: number;
  teleLanes: TeleLane[];
  teleLaneH: number;
  teleBarH: number;
  axisTop: number;
  axisLineY: number;
  groups: GroupBlock[];
  gasLaneH: number;
  gasMarkerH: number;
  markerW: number;
  x: (um: number) => number;
}

function computeLayout(
  width: number,
  telescopes: Telescope[],
  groups: GasGroup[],
  gases: Gas[],
): Layout {
  const gutter = Math.round(clamp(width * 0.26, 120, 190));
  const marginRight = 20;
  const plotLeft = gutter;
  const plotRight = width - marginRight;
  const plotW = Math.max(plotRight - plotLeft, 10);

  const x = (um: number): number =>
    plotLeft + ((Math.log10(clamp(um, AXIS.min_um, AXIS.max_um)) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * plotW;

  const teleLaneH = 44;
  const teleBarH = 22;
  const teleGap = 10;
  const gasLaneH = 34;
  const gasMarkerH = 20;
  const markerW = 9;
  const gasGap = 8;
  const groupHeaderH = 34;

  let y = 10;
  const regionLabelY = y + 12;
  y += 28;
  const plotTop = y;

  const teleHeaderTop = y;
  y += 28;
  const teleLanes: TeleLane[] = telescopes.map((telescope) => {
    const top = y;
    y += teleLaneH + teleGap;
    return { telescope, top };
  });

  y += 8;
  const axisTop = y;
  const axisLineY = y + 6;
  y += 34;

  const groupBlocks: GroupBlock[] = [];
  for (const group of groups) {
    const inGroup = gases.filter((g) => g.group === group.id);
    if (inGroup.length === 0) continue;
    const headerTop = y;
    y += groupHeaderH;
    const lanes: GasLane[] = inGroup.map((gas) => {
      const top = y;
      y += gasLaneH + gasGap;
      return { gas, top };
    });
    groupBlocks.push({ group, headerTop, lanes });
  }

  const plotBottom = y - gasGap + 6;
  const height = plotBottom + 12;

  return {
    width,
    height,
    gutter,
    plotLeft,
    plotRight,
    plotW,
    plotTop,
    plotBottom,
    regionLabelY,
    teleHeaderTop,
    teleLanes,
    teleLaneH,
    teleBarH,
    axisTop,
    axisLineY,
    groups: groupBlocks,
    gasLaneH,
    gasMarkerH,
    markerW,
    x,
  };
}

/** Measure the container width so the SVG can scale to it. */
function useContainerWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const update = () => setWidth(node.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

function fmtUm(values: number[]): string {
  return values.map((v) => `${v}`).join(", ");
}

export default function CoverageChart({
  telescopes,
  groups,
  gases,
  active,
  pinned,
  matchedTelescopeIds,
  matchedGasIds,
  onHover,
  onTogglePin,
}: CoverageChartProps) {
  const [ref, width] = useContainerWidth();
  const layout = useMemo(
    () => (width > 0 ? computeLayout(width, telescopes, groups, gases) : null),
    [width, telescopes, groups, gases],
  );

  const isDimmed = (kind: Selection["kind"], id: string): boolean => {
    if (!active) return false;
    return kind === "gas" ? !matchedGasIds.has(id) : !matchedTelescopeIds.has(id);
  };
  const isActive = (sel: Selection): boolean =>
    active !== null && active.kind === sel.kind && active.id === sel.id;
  const isPinned = (sel: Selection): boolean =>
    pinned !== null && pinned.kind === sel.kind && pinned.id === sel.id;

  const tooltip = useMemo(() => {
    if (!layout || !active) return null;
    if (active.kind === "gas") {
      const lane = layout.groups.flatMap((b) => b.lanes).find((l) => l.gas.id === active.id);
      if (!lane) return null;
      const gas = lane.gas;
      const anchorX = layout.x(Math.min(...gas.bands_um));
      return {
        left: clamp(anchorX, 90, layout.width - 90),
        top: lane.top,
        title: gas.name,
        body: `Bands: ${fmtUm(gas.bands_um)} um`,
      };
    }
    const lane = layout.teleLanes.find((l) => l.telescope.id === active.id);
    if (!lane) return null;
    const t = lane.telescope;
    return {
      left: clamp(layout.x(t.min_um), 90, layout.width - 90),
      top: lane.top,
      title: t.name,
      body: `Range: ${t.min_um} to ${t.max_um} um`,
    };
  }, [layout, active]);

  return (
    <div ref={ref} className="coverage-plot" onMouseLeave={() => onHover(null)}>
      {layout ? (
        <svg
          className="coverage-svg"
          width={layout.width}
          height={layout.height}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          role="presentation"
        >
          <defs>
            <pattern
              id="coverage-hatch"
              width={7}
              height={7}
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect width={7} height={7} fill="var(--md-sys-color-surface-container-high)" />
              <line x1={0} y1={0} x2={0} y2={7} stroke="var(--md-sys-color-outline)" strokeWidth={1.6} />
            </pattern>
          </defs>

          {/* Region background shading. */}
          {SPECTRAL_REGIONS.map((region, i) => (
            <rect
              key={region.id}
              x={layout.x(region.min_um)}
              y={layout.plotTop}
              width={layout.x(region.max_um) - layout.x(region.min_um)}
              height={layout.plotBottom - layout.plotTop}
              fill="var(--md-sys-color-on-surface)"
              fillOpacity={i % 2 === 0 ? 0.03 : 0.06}
            />
          ))}

          {/* Region labels. */}
          {SPECTRAL_REGIONS.map((region) => (
            <text
              key={region.id}
              x={layout.x(region.min_um) + 6}
              y={layout.regionLabelY}
              className="coverage-region-label"
            >
              {region.label}
            </text>
          ))}

          {/* Target window band. */}
          <rect
            x={layout.x(TARGET_WINDOW.min_um)}
            y={layout.plotTop}
            width={layout.x(TARGET_WINDOW.max_um) - layout.x(TARGET_WINDOW.min_um)}
            height={layout.plotBottom - layout.plotTop}
            fill="var(--md-sys-color-on-surface)"
            fillOpacity={0.05}
          />
          <line
            x1={layout.x(TARGET_WINDOW.min_um)}
            x2={layout.x(TARGET_WINDOW.min_um)}
            y1={layout.plotTop}
            y2={layout.plotBottom}
            className="coverage-window-edge"
          />
          <line
            x1={layout.x(TARGET_WINDOW.max_um)}
            x2={layout.x(TARGET_WINDOW.max_um)}
            y1={layout.plotTop}
            y2={layout.plotBottom}
            className="coverage-window-edge"
          />
          <text
            x={layout.x(TARGET_WINDOW.min_um) + 5}
            y={layout.plotBottom - 7}
            className="coverage-window-label"
          >
            {TARGET_WINDOW.label}
          </text>

          {/* Gridlines and tick labels on the shared log axis. */}
          {AXIS.ticks_um.map((tick) => (
            <line
              key={`grid-${tick}`}
              x1={layout.x(tick)}
              x2={layout.x(tick)}
              y1={layout.plotTop}
              y2={layout.plotBottom}
              className="coverage-gridline"
            />
          ))}
          <line
            x1={layout.plotLeft}
            x2={layout.plotRight}
            y1={layout.axisLineY}
            y2={layout.axisLineY}
            className="coverage-axis-line"
          />
          {AXIS.ticks_um.map((tick) => (
            <text
              key={`tick-${tick}`}
              x={layout.x(tick)}
              y={layout.axisTop + 20}
              className="coverage-tick-label"
              textAnchor="middle"
            >
              {tick}
            </text>
          ))}

          {/* Section header: telescopes. */}
          <text x={4} y={layout.teleHeaderTop + 16} className="coverage-section-label">
            Telescopes
          </text>

          {/* Telescope bars. */}
          {layout.teleLanes.map(({ telescope, top }) => {
            const sel: Selection = { kind: "telescope", id: telescope.id };
            const dimmed = isDimmed("telescope", telescope.id);
            const activeRow = isActive(sel);
            const color = telescopeColor(telescope.id);
            const isPhoto = telescope.kind === "photometry";
            const barY = top + (layout.teleLaneH - layout.teleBarH) / 2;
            const x0 = layout.x(telescope.min_um);
            const x1 = layout.x(telescope.max_um);
            const noteX = x1 + 10;
            const noteFits = isPhoto || noteX < layout.plotRight - 60;
            return (
              <g key={telescope.id}>
                {activeRow ? (
                  <rect
                    x={2}
                    y={top - 2}
                    width={layout.width - 4}
                    height={layout.teleLaneH + 4}
                    rx={10}
                    fill={color}
                    fillOpacity={0.12}
                  />
                ) : null}
                <g className="coverage-row-visual" opacity={dimmed ? 0.24 : 1}>
                  <text
                    x={layout.gutter - 12}
                    y={top + layout.teleLaneH / 2 + 5}
                    className="coverage-row-name"
                    textAnchor="end"
                  >
                    {telescope.name}
                  </text>
                  <rect
                    x={x0}
                    y={barY}
                    width={Math.max(x1 - x0, 3)}
                    height={layout.teleBarH}
                    rx={5}
                    fill={isPhoto ? "url(#coverage-hatch)" : color}
                    fillOpacity={isPhoto ? 1 : telescope.subBands ? 0.42 : 0.9}
                    stroke={isPhoto ? "var(--md-sys-color-outline)" : color}
                    strokeWidth={1.2}
                  />
                  {telescope.subBands?.map((sub) => (
                    <rect
                      key={sub.label}
                      x={layout.x(sub.min_um)}
                      y={barY + 2}
                      width={Math.max(layout.x(sub.max_um) - layout.x(sub.min_um), 3)}
                      height={layout.teleBarH - 4}
                      rx={4}
                      fill={color}
                      stroke={SHELL}
                      strokeWidth={1.5}
                    />
                  ))}
                  {noteFits ? (
                    <text
                      x={noteX}
                      y={top + layout.teleLaneH / 2 + 5}
                      className="coverage-note"
                    >
                      {telescope.note}
                    </text>
                  ) : null}
                </g>
                <rect
                  className="coverage-hit"
                  x={1.5}
                  y={top}
                  width={layout.width - 3}
                  height={layout.teleLaneH}
                  rx={10}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isPinned(sel)}
                  aria-label={`${telescope.name}, ${telescope.kind}, ${telescope.note}. Coverage ${telescope.min_um} to ${telescope.max_um} micrometres. Activate to highlight the gases it can observe.`}
                  onMouseEnter={() => onHover(sel)}
                  onFocus={() => onHover(sel)}
                  onBlur={() => onHover(null)}
                  onClick={() => {
                    onTogglePin(sel);
                    onHover(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onTogglePin(sel);
                    }
                  }}
                />
              </g>
            );
          })}

          {/* Gas groups and rows. */}
          {layout.groups.map((block) => (
            <g key={block.group.id}>
              <rect
                x={4}
                y={block.headerTop + 6}
                width={12}
                height={12}
                rx={3}
                fill={gasColor(block.group.id)}
              />
              <text x={24} y={block.headerTop + 16} className="coverage-section-label">
                {block.group.label}
              </text>
              {block.lanes.map(({ gas, top }) => {
                const sel: Selection = { kind: "gas", id: gas.id };
                const dimmed = isDimmed("gas", gas.id);
                const activeRow = isActive(sel);
                const color = gasColor(gas.group);
                const markerY = top + (layout.gasLaneH - layout.gasMarkerH) / 2;
                return (
                  <g key={gas.id}>
                    {activeRow ? (
                      <rect
                        x={2}
                        y={top - 2}
                        width={layout.width - 4}
                        height={layout.gasLaneH + 4}
                        rx={10}
                        fill={color}
                        fillOpacity={0.1}
                      />
                    ) : null}
                    <g className="coverage-row-visual" opacity={dimmed ? 0.24 : 1}>
                      <text
                        x={layout.gutter - 12}
                        y={top + layout.gasLaneH / 2 + 5}
                        className="coverage-row-name"
                        textAnchor="end"
                      >
                        {gas.name}
                      </text>
                      {gas.bands_um.map((um, i) => (
                        <rect
                          key={`${gas.id}-${um}-${i}`}
                          x={layout.x(um) - layout.markerW / 2}
                          y={markerY}
                          width={layout.markerW}
                          height={layout.gasMarkerH}
                          rx={layout.markerW / 2}
                          fill={color}
                          stroke={activeRow ? SHELL : "none"}
                          strokeWidth={activeRow ? 1.2 : 0}
                        />
                      ))}
                    </g>
                    <rect
                      className="coverage-hit"
                      x={1.5}
                      y={top}
                      width={layout.width - 3}
                      height={layout.gasLaneH}
                      rx={10}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isPinned(sel)}
                      aria-label={`${gas.name}, ${block.group.label}, absorption bands at ${fmtUm(gas.bands_um)} micrometres.${gas.note ? ` ${gas.note}` : ""} Activate to highlight the telescopes that can observe it.`}
                      onMouseEnter={() => onHover(sel)}
                      onFocus={() => onHover(sel)}
                      onBlur={() => onHover(null)}
                      onClick={() => {
                        onTogglePin(sel);
                        onHover(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onTogglePin(sel);
                        }
                      }}
                    />
                  </g>
                );
              })}
            </g>
          ))}
        </svg>
      ) : (
        <div className="coverage-plot-placeholder" aria-hidden="true" />
      )}

      {tooltip ? (
        <div
          className="chart-tooltip coverage-tooltip"
          style={{ left: tooltip.left, top: tooltip.top }}
          role="presentation"
        >
          <div className="coverage-tooltip-title">{tooltip.title}</div>
          <div className="tt-key">{tooltip.body}</div>
        </div>
      ) : null}
    </div>
  );
}
