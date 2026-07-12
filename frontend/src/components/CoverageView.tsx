"use client";

import { useMemo, useState } from "react";
import {
  GAS_GROUPS,
  GASES,
  TARGET_WINDOW,
  TELESCOPES,
  gasesReachableByTelescope,
  telescopesCoveringGas,
  type GasGroupId,
} from "@/data/coverage";
import CoverageChart, { gasColor, telescopeColor, type Selection } from "./CoverageChart";
import Icon from "./Icon";

type Filter = "all" | GasGroupId;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "industrial", label: "Industrial" },
  { key: "biosignature", label: "Biosignatures" },
];

function groupLabel(id: GasGroupId): string {
  return GAS_GROUPS.find((g) => g.id === id)?.label ?? id;
}

export default function CoverageView() {
  const [filter, setFilter] = useState<Filter>("all");
  const [pinned, setPinned] = useState<Selection | null>(null);
  const [hover, setHover] = useState<Selection | null>(null);

  const active = hover ?? pinned;

  const filteredGases = useMemo(
    () => (filter === "all" ? GASES : GASES.filter((g) => g.group === filter)),
    [filter],
  );

  function changeFilter(next: Filter) {
    setFilter(next);
    const visible = new Set(
      (next === "all" ? GASES : GASES.filter((g) => g.group === next)).map((g) => g.id),
    );
    setPinned((p) => (p && p.kind === "gas" && !visible.has(p.id) ? null : p));
    setHover((h) => (h && h.kind === "gas" && !visible.has(h.id) ? null : h));
  }

  function togglePin(sel: Selection) {
    setPinned((p) => (p && p.kind === sel.kind && p.id === sel.id ? null : sel));
  }

  function clearSelection() {
    setPinned(null);
    setHover(null);
  }

  const { matchedTelescopeIds, matchedGasIds } = useMemo(() => {
    const teleIds = new Set<string>();
    const gasIds = new Set<string>();
    if (active) {
      if (active.kind === "gas") {
        const gas = GASES.find((g) => g.id === active.id);
        if (gas) {
          gasIds.add(gas.id);
          telescopesCoveringGas(gas, TELESCOPES).forEach((t) => teleIds.add(t.id));
        }
      } else {
        const t = TELESCOPES.find((x) => x.id === active.id);
        if (t) {
          teleIds.add(t.id);
          gasesReachableByTelescope(t, filteredGases).forEach((g) => gasIds.add(g.id));
        }
      }
    }
    return { matchedTelescopeIds: teleIds, matchedGasIds: gasIds };
  }, [active, filteredGases]);

  const readout = useMemo(() => {
    if (!active) {
      return "Hover or focus a gas or a telescope to see which can observe it. On touch, tap to pin a selection.";
    }
    if (active.kind === "gas") {
      const gas = GASES.find((g) => g.id === active.id);
      if (!gas) return "";
      const covering = telescopesCoveringGas(gas, TELESCOPES);
      const bands = `bands at ${gas.bands_um.join(", ")} um`;
      const base =
        covering.length > 0
          ? `${gas.name} (${groupLabel(gas.group)}), ${bands}. Visible to: ${covering
              .map((t) => t.name)
              .join(", ")}.`
          : `${gas.name} (${groupLabel(gas.group)}), ${bands}. Not covered by the telescopes shown.`;
      return gas.note ? `${base} ${gas.note}` : base;
    }
    const t = TELESCOPES.find((x) => x.id === active.id);
    if (!t) return "";
    if (t.kind === "photometry") {
      return `${t.name} measures broadband photometry, not spectra, so it does not resolve individual gas bands.`;
    }
    const reach = gasesReachableByTelescope(t, filteredGases);
    return `${t.name} (${t.min_um} to ${t.max_um} um). Can reach: ${
      reach.length > 0 ? reach.map((g) => g.name).join(", ") : "none of the gases shown"
    }.`;
  }, [active, filteredGases]);

  return (
    <main className="page">
      <header className="coverage-header">
        <h1 id="coverage-heading" className="type-headline">
          Coverage map
        </h1>
        <p className="type-body muted" style={{ margin: 0, maxWidth: 720 }}>
          Telescope wavelength coverage against the absorption bands of the target gases, on one
          shared logarithmic wavelength axis. It answers which gas you are hunting and which
          telescope can see it. This is standalone reference material and does not use the data
          source selector.
        </p>
      </header>

      <section className="card raised stack" aria-labelledby="coverage-heading">
        <div className="card-header" style={{ alignItems: "center" }}>
          <div className="field" role="group" aria-label="Filter gases by group">
            <label id="coverage-filter-label">Show gases</label>
            <div className="segmented" aria-labelledby="coverage-filter-label">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  className="segmented-btn"
                  aria-pressed={filter === f.key}
                  onClick={() => changeFilter(f.key)}
                >
                  <span>{f.label}</span>
                </button>
              ))}
            </div>
          </div>
          {pinned ? (
            <div className="segmented">
              <button type="button" className="segmented-btn" onClick={clearSelection}>
                <Icon name="close" />
                <span>Clear selection</span>
              </button>
            </div>
          ) : null}
        </div>

        <p className="coverage-readout type-body" role="status" aria-live="polite">
          <Icon name={active ? (active.kind === "gas" ? "science" : "podcasts") : "info"} />
          <span>{readout}</span>
        </p>

        <div className="chart-shell">
          <CoverageChart
            telescopes={TELESCOPES}
            groups={GAS_GROUPS}
            gases={filteredGases}
            active={active}
            pinned={pinned}
            matchedTelescopeIds={matchedTelescopeIds}
            matchedGasIds={matchedGasIds}
            onHover={setHover}
            onTogglePin={togglePin}
          />
        </div>

        <div className="chart-legend" aria-hidden="true">
          <span className="legend-item">
            <span className="legend-swatch" style={{ backgroundColor: gasColor("industrial") }} />
            Industrial gases
          </span>
          <span className="legend-item">
            <span className="legend-swatch" style={{ backgroundColor: gasColor("biosignature") }} />
            Biosignatures
          </span>
          {TELESCOPES.filter((t) => t.kind === "spectroscopy").map((t) => (
            <span className="legend-item" key={t.id}>
              <span
                className="legend-swatch"
                style={{ backgroundColor: telescopeColor(t.id) }}
              />
              {t.name}
            </span>
          ))}
          <span className="legend-item">
            <span className="legend-swatch coverage-legend-hatch" />
            Photometry, not spectra
          </span>
          <span className="legend-item">
            <span className="legend-swatch coverage-legend-window" />
            Target window {TARGET_WINDOW.min_um} to {TARGET_WINDOW.max_um} um
          </span>
        </div>

        <p className="type-label muted" style={{ margin: 0 }}>
          Band positions are approximate seed values, to be verified against HITRAN2020. The bars
          show wavelength coverage only, not sensitivity or detectability. The wavelength axis is
          logarithmic.
        </p>
      </section>

      {/* Text alternative to the chart for assistive technology. */}
      <div className="sr-only">
        <h2>Coverage map, described</h2>
        <p>
          A logarithmic wavelength axis from {0.1} to {30} micrometres. Telescope coverage ranges are
          shown above the axis, and gas absorption bands below it. The technosignature target window
          spans {TARGET_WINDOW.min_um} to {TARGET_WINDOW.max_um} micrometres.
        </p>
        <h3>Telescopes</h3>
        <ul>
          {TELESCOPES.map((t) => (
            <li key={t.id}>
              {t.name}: {t.min_um} to {t.max_um} micrometres, {t.kind}
              {t.subBands ? `, ${t.subBands.map((s) => `${s.label} ${s.min_um} to ${s.max_um} um`).join(", ")}` : ""}
              .
            </li>
          ))}
        </ul>
        {GAS_GROUPS.map((group) => {
          const inGroup = filteredGases.filter((g) => g.group === group.id);
          if (inGroup.length === 0) return null;
          return (
            <div key={group.id}>
              <h3>{group.label}</h3>
              <ul>
                {inGroup.map((g) => (
                  <li key={g.id}>
                    {g.name}: bands at {g.bands_um.join(", ")} micrometres. Visible to{" "}
                    {telescopesCoveringGas(g, TELESCOPES)
                      .map((t) => t.name)
                      .join(", ") || "none of the telescopes shown"}
                    .
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </main>
  );
}
